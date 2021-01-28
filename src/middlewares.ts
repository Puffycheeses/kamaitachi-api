import db from "./db";
import Sanitise from "mongo-sanitize"; // sanitise
import userCore from "./core/user-core";
import apiConfig from "./apiconfig";
import config from "./config/config";
import { NextFunction, Request, Response } from "express";

async function AllowGuestAccess(
    req: Request,
    res: Response,
    next: NextFunction
): MiddlewareResponse {
    let key = await GetAPIKey(req);

    if (!key || key.expireTime < Date.now()) {
        if (req.method !== "GET") {
            return res.status(401).json({
                success: false,
                description: "Unauthorised to make non-GET requests without API key!",
            });
        }
    }

    if (key) {
        let requestingUser = await db.get("users").findOne(
            {
                id: key.assignedTo,
            },
            {
                projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS,
            }
        );

        if (!requestingUser) {
            return next();
        }

        req.user = requestingUser;
    }

    req.apikey = key;

    next();
}

async function GetAPIKey(req: Request): Promise<PublicAPIKeyDocument | null> {
    let givenKey = req.cookies.apikey;

    if (!givenKey) {
        givenKey = req.headers.authorization;
        if (givenKey && givenKey.startsWith("Bearer ")) {
            givenKey = givenKey.split(" ")[1];
        }
    }

    let key = await db.get("public-api-keys").findOne({ apiKey: givenKey });

    return key;
}

async function RequireAPIKey(req: Request, res: Response, next: NextFunction): MiddlewareResponse {
    let key = req.apikey;

    if (!key || key.expireTime < Date.now()) {
        return res.status(401).json({
            success: false,
            description: "Unauthorised.",
        });
    }

    let requestingUser = await db.get("users").findOne(
        {
            id: key.assignedTo,
        },
        {
            projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS,
        }
    );

    if (!requestingUser) {
        return res.status(401).json({
            success: false,
            description: "This key has been revoked.",
        });
    }

    req.user = requestingUser;
    req.apikey = key;

    next();
}

async function RequireExistingUser(
    req: Request,
    res: Response,
    next: NextFunction
): MiddlewareResponse {
    let user = await userCore.GetUser(req.params.userID);

    if (!user) {
        return res.status(404).json({
            success: false,
            description: `Can not find user '${req.params.userID}'.`,
        });
    }

    req.requestedUser = user;

    next();
}

async function RequireExistingSongID(
    req: Request,
    res: Response,
    next: NextFunction
): MiddlewareResponse {
    let song = await db
        .get(`songs-${req.params.game}`)
        .findOne({ id: parseInt(req.params.songID) });
    if (!song) {
        return res.status(404).json({
            success: false,
            description: `Can not find songID ${req.params.songID}.`,
        });
    }

    next();
}

async function RequireUserKeyMatch(
    req: Request,
    res: Response,
    next: NextFunction
): MiddlewareResponse {
    if (!req.user || !req.requestedUser) {
        return res.status(401).json({
            success: false,
            description: "Cannot edit information for users that are not you.",
        });
    }

    if (req.user.id !== req.requestedUser.id) {
        return res.status(401).json({
            success: false,
            description: "Cannot edit information for users that are not you.",
        });
    }
    next();
}

async function LogRequest(req: Request, res: Response, next: NextFunction): MiddlewareResponse {
    let key = await db.get("public-api-keys").findOne({ apiKey: req.query.key });

    let requestObj: PublicAPIRequestDocument = {
        key,
        location: req.originalUrl,
        timestamp: Date.now(),
        ip: req.ip,
    };

    await db.get("public-api-requests").insert(requestObj);

    return next();
}

async function MaintenanceMode(
    req: Request,
    res: Response,
    next: NextFunction
): MiddlewareResponse {
    try {
        let key = await db.get("public-api-keys").findOne({ apiKey: req.query.key });
        if (!key.permissions.admin) {
            return res.status(500).json({
                success: false,
                description:
                    "Kamaitachi's API is currently in maintenance mode. It will be back up soon! You can join the discord to keep up with updates on server status: https://discord.gg/9B8xm4h. Apologies for the inconvenience.",
            });
        }
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            success: false,
            description:
                "Kamaitachi's API is currently in maintenance mode. It will be back up soon! You can join the discord to keep up with updates on server status: https://discord.gg/9B8xm4h. Apologies for the inconvenience.",
        });
    }

    next();
}

// try and not get injected
async function SanitiseInput(req: Request, res: Response, next: NextFunction): MiddlewareResponse {
    Sanitise(req.query);
    for (const key in req.query) {
        if (typeof req.query[key] === "object" && req.query.hasOwnProperty(key)) {
            return res.status(400).json({
                success: false,
                description:
                    "Passed data was determined to be malicious. Nesting objects is not allowed.",
            });
        } else if (key in Object.prototype) {
            return res.status(400).json({
                success: false,
                description: "Passed data was determined to be malicious.",
            });
        }
    }

    Sanitise(req.body);

    // temp "is-admin" check
    if (!(req.apikey && req.apikey.assignedTo === 1 && req.body.punchthrough)) {
        for (const key in req.body) {
            if (typeof req.body[key] === "object" && req.body.hasOwnProperty(key)) {
                return res.status(400).json({
                    success: false,
                    description:
                        "Passed data was determined to be malicious. Nesting objects is not allowed.",
                });
            } else if (key in Object.prototype) {
                return res.status(400).json({
                    success: false,
                    description: "Passed data was determined to be malicious.",
                });
            }
            req.body[key] = req.body[key].toString(); // potentially safety critical, apologies.
        }
    }

    next();
}

async function DecodeURIComponents(
    req: Request,
    res: Response,
    next: NextFunction
): MiddlewareResponse {
    // for every key in the query decode it.
    if (req.query && typeof req.query === "object") {
        for (const key in req.query) {
            if (req.query.hasOwnProperty(key)) {
                req.query[key] = decodeURIComponent(req.query[key] as string);
            }
        }
    }

    next();
}

async function RequireValidFolderType(
    req: Request,
    res: Response,
    next: NextFunction
): MiddlewareResponse {
    if (!apiConfig.VALID_FOLDER_TYPES.includes(req.params.folderType)) {
        return res.status(400).json({
            success: false,
            description: "This folderType is unsupported.",
        });
    }

    next();
}

async function RequireValidGame(
    req: Request,
    res: Response,
    next: NextFunction
): MiddlewareResponse {
    if (!config.supportedGames.includes(req.params.game as Game)) {
        return res.status(400).json({
            success: false,
            description: "This game is not supported.",
        });
    }
    next();
}

// TEMP, DO NOT TOUCH
// im the only person who ever tests this stuff anyway
async function RequireAdmin(req: Request, res: Response, next: NextFunction): MiddlewareResponse {
    if (req.apikey?.assignedTo !== 1) {
        return res.status(403).json({
            success: false,
            description: "Forbidden.",
        });
    }

    next();
}

export default {
    SanitiseInput,
    MaintenanceMode,
    DecodeURIComponents,
    LogRequest,
    RequireAPIKey,
    RequireExistingUser,
    RequireUserKeyMatch,
    RequireValidFolderType,
    RequireExistingSongID,
    RequireValidGame,
    RequireAdmin,
    AllowGuestAccess,
};
