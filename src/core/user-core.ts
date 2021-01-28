import db from "../db";
import apiConfig from "../apiconfig";
import config from "../config/config";

// finds the user on userID or username.
// determines this by checking if input is a string
// note that names starting with numbers are forbidden in kamai, so this is all good.
// default case is to return null.
async function GetUser(userID: string): Promise<PublicUserDocument | null> {
    let user = null;
    let intUserID = parseInt(userID);
    if (isNaN(intUserID) || intUserID < 0) {
        // user handle has been passed
        // use regex to ensure case insensitivity
        user = await db
            .get("users")
            .findOne(
                { username: new RegExp(`^${userID}$`, "i") },
                { fields: apiConfig.REMOVE_PRIVATE_USER_RETURNS }
            );
    } else {
        user = await db
            .get("users")
            .findOne({ id: intUserID }, { fields: apiConfig.REMOVE_PRIVATE_USER_RETURNS });
    }
    return user;
}

async function GetUserWithID(userID: integer): Promise<PublicUserDocument | null> {
    let user = await db
        .get("users")
        .findOne({ id: userID }, { projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS });

    return user;
}

async function GetUsers(userIDs: integer[]): Promise<Array<PublicUserDocument>> {
    let users = await db
        .get("users")
        .find({ id: { $in: userIDs } }, { fields: apiConfig.REMOVE_PRIVATE_USER_RETURNS });

    return users;
}

async function GetUserWithAPIKey(aKey: string): Promise<PublicUserDocument | null> {
    let apiKey = await db
        .get("public-api-keys")
        .findOne({ apiKey: aKey }, { projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS });

    if (!apiKey) {
        console.error("apiKey removed during query.", aKey);
        return null;
    }

    let user = await db.get("users").findOne(
        { id: apiKey.assignedTo },
        {
            projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS,
        }
    );

    if (!user) {
        console.error("KEY ASSIGNED TO USER WHO DOES NOT EXIST", aKey);
        return null;
    }

    return user;
}

async function GetAllUsers(): Promise<Array<PublicUserDocument>> {
    let users = await db
        .get("users")
        .find({}, { projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS });
    return users;
}

async function GetPlayersOnGame(
    game: Game,
    playtype: Playtypes[Game]
): Promise<Array<PublicUserDocument>> {
    let users = [];
    if (!playtype) {
        users = await db.get("users").find(
            {
                $or: config.validPlaytypes[game].map((e) => ({
                    [`ratings.${game}.${e}`]: { $gt: 0 },
                })),
            },
            {
                projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS,
            }
        );
    } else {
        users = await db.get("users").find(
            {
                [`ratings.${game}.${playtype}`]: { $gt: 0 },
            },
            {
                projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS,
            }
        );
    }

    return users;
}

// returns true/false, as expected
async function IsUserIDOnline(userID: string): Promise<boolean> {
    let user = await GetUser(userID);

    if (!user) {
        throw new Error(`User ${userID} does not exist, and cannot be online.`);
    }

    return Date.now() - user.lastSeen > apiConfig.TIME_DELTA_ONLINE;
}

export default {
    GetUser,
    GetAllUsers,
    IsUserIDOnline,
    GetPlayersOnGame,
    GetUserWithAPIKey,
    GetUsers,
    GetUserWithID,
};
