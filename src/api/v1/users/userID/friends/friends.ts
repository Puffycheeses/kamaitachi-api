import * as express from "express";
import db from "../../../../../db";
const router = express.Router({ mergeParams: true });
import userCore from "../../../../../core/user-core";
import middlewares from "../../../../../middlewares";
import apiConfig from "../../../../../apiconfig";

/**
 * @namespace /v1/users/:userID/friends
 */

/**
 * Returns all of your friends' user documents.
 * @name GET /v1/users/:userID/friends
 */
router.get("/", async (req, res) => {
    let user = req.requestedUser as PublicUserDocument;

    let friends = await userCore.GetUsers(user.friends);

    return res.status(200).json({
        success: true,
        description: `Successfully found friends of user '${req.params.userID}'`,
        body: friends,
    });
});

/**
 * Returns all your online friends.
 * @name GET /v1/users/:userID/friends/online
 */
router.get("/online", async (req, res) => {
    let user = req.requestedUser as PublicUserDocument;

    let curTime = Date.now();
    let friends = await db.get("users").find(
        {
            id: { $in: user.friends },
            lastSeen: {
                $gt: curTime - apiConfig.TIME_DELTA_ONLINE,
            },
        },
        { projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS }
    );

    return res.status(200).json({
        success: true,
        description: `Successfully found friends of user '${req.params.userID}'`,
        body: friends,
    });
});

/**
 * Adds a friend to your list of friends.
 * @name POST /v1/users/:userID/friends/add-friend
 * @param friendID - The ID of the friend you want to add.
 */
router.post("/add-friend", middlewares.RequireUserKeyMatch, async (req, res) => {
    let friend = await userCore.GetUser(req.body.friendID);

    if (!friend) {
        return res.status(404).json({
            success: false,
            description: `This user ${req.body.friendID} does not exist.`,
        });
    }

    let user = req.requestedUser as PublicUserDocument;

    if (user.friends.length >= 100) {
        return res.status(400).json({
            success: false,
            description: "You have reached the friend limit.",
        });
    }

    if (user.friends.includes(friend.id)) {
        return res.status(400).json({
            success: false,
            description: "You are already friends with this user.",
        });
    }

    await db.get("users").update({ _id: user._id }, { $push: { friends: friend.id } });

    return res.status(200).json({
        success: true,
        description: `Successfully added ${friend.displayname} as a friend!`,
        body: friend,
    });
});

/**
 * Removes a friend from your list of friends.
 * @name POST /v1/users/:userID/friends/remove-friend
 * @param friendID - The ID of the friend you want to remove.
 */
router.post("/remove-friend", middlewares.RequireUserKeyMatch, async (req, res) => {
    let friend = await userCore.GetUser(req.body.friendID);

    if (!friend) {
        return res.status(404).json({
            success: false,
            description: `This user ${req.body.friendID} does not exist.`,
        });
    }

    let user = req.requestedUser as PublicUserDocument;

    if (!user.friends.includes(friend.id)) {
        return res.status(400).json({
            success: false,
            description: `friendID '${req.body.friendID}' is not a friend of userID ${req.params.userID}'s`,
        });
    }

    let newFriends = user.friends.filter((f) => f !== friend!.id);

    await db.get("users").update({ _id: user._id }, { $set: { friends: newFriends } });

    return res.status(200).json({
        success: true,
        description: `Successfully removed ${friend.displayname} as a friend.`,
        body: friend,
    });
});

export default router;
