import * as express from "express";
import db from "../../../db";
import userCore from "../../../core/user-core";
import apiConfig from "../../../apiconfig";
import regexSanitise from "escape-string-regexp";
import dbCore from "../../../core/db-core";

const router = express.Router({ mergeParams: true });

/**
 * @namespace /v1/users
 */

const MAX_USER_RETURN_LIMIT = 100;

/**
 * Performs a fancy query on users.
 * @name GET /v1/users
 */
router.get("/", async (req: KTRequest, res) => {
    let dbRes = await dbCore.NBQuery<PublicUserDocument>(
        "users",
        req.query,
        true,
        MAX_USER_RETURN_LIMIT
    );

    return res.status(dbRes.statusCode).json(dbRes.body);
});

/**
 * Returns ALL online users.
 * @name GET /v1/users
 * @todo This won't scale, at all.
 */
router.get("/online", async (req, res) => {
    let curTime = Date.now();

    let onlineUsers = await db.get("users").find(
        {
            lastSeen: {
                $gt: curTime - apiConfig.TIME_DELTA_ONLINE,
            },
        },
        {
            projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS,
        }
    );

    let usersBody = { items: onlineUsers };

    return res.status(200).json({
        success: true,
        description: `There are ${onlineUsers.length} user(s) online.`,
        body: usersBody,
    });
});

/**
 * Performs a search on users.
 * @name GET /v1/users/search
 * @param username - The username to search.
 * @param minimalReturns - if exactly "true", will only return username, displayname
 * and id. This is for realtime search things so as not to thrash the client.
 */
router.get("/search", async (req: KTRequest, res) => {
    if (!req.query.username) {
        return res.status(400).json({
            success: false,
            description: "No Username provided.",
        });
    }

    let projection: Record<string, 0 | 1> = apiConfig.REMOVE_PRIVATE_USER_RETURNS;

    if (req.query.minimalReturns) {
        projection = { username: 1, id: 1, displayname: 1 };
    }

    let users = await db.get("users").find(
        {
            username: new RegExp(`${regexSanitise(req.query.username)}`, "i"),
        },
        {
            projection,
            limit: MAX_USER_RETURN_LIMIT,
        }
    );

    return res.status(200).json({
        success: true,
        description: `Successfully found ${users.length} similar usernames.`,
        body: {
            items: users,
        },
    });
});

// mounts
import userIDRouter from "./userID/userID";
router.use("/:userID", userIDRouter);

export default router;
