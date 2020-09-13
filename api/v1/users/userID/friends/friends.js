const express = require("express");
const db = require("../../../../../db.js");
const router = express.Router({mergeParams: true});
const userCore = require("../../../../../core/user-core.js");
const middlewares = require("../../../../../middlewares.js");
const apiConfig = require("../../../../../apiconfig.js");

// mounted on /api/v1/users/:userID/friends

router.get("/", async function(req,res){
    let user = req.user;
    
    let friends = await db.get("users").find({id: {$in: user.friends}}, {fields: apiConfig.REMOVE_PRIVATE_USER_RETURNS});

    return res.status(200).json({
        success: true,
        description: "Successfully found friends of user '" + req.params.userID + "'",
        body: {
            items: friends
        }
    });
});

router.get("/online", async function(req,res){
    let user = req.user;

    let friends = await db.get("users").find({id: {$in: user.friends}, lastSeen: {
        $gt: curTime - apiConfig.TIME_DELTA_ONLINE
    }}, {fields: apiConfig.REMOVE_PRIVATE_USER_RETURNS});

    return res.status(200).json({
        success: true,
        description: "Successfully found friends of user '" + req.params.userID + "'",
        body: {
            items: friends
        }
    });
});

router.patch("/add", middlewares.RequireUserKeyMatch, async function(req,res){
    let friend = await userCore.GetUser(req.body.friendID);

    if (!friend){
        return res.status(404).json({
            success: false,
            description: `This user ${req.body.friendID} does not exist.`
        });
    }
    
    let user = req.user;

    if (user.friends.length > 100){
        return res.status(400).json({
            success: false,
            description: "You have reached the friend limit."
        });
    }

    if (user.friends.includes(friend.id)){
        return res.status(400).json({
            success: false,
            description: "You are already friends with this user."
        })
    }

    await db.get("users").update({_id: user._id}, {$push: {friends: friend.id}});
    
    return res.status(201).json({
        success: true,
        description: `Successfully added ${friend.displayname} as a friend!`,
        body: {
            item: friend
        }
    });
});

router.patch("/remove", middlewares.RequireUserKeyMatch, async function(req,res){
    let friend = await userCore.GetUser(req.body.friendID);

    if (!friend){
        return res.status(404).json({
            success: false,
            description: `This user ${req.body.friendID} does not exist.`
        });
    }
    let user = req.user;

    if (!user.friends.includes(friend.id)){
        return res.status(400).json({
            success: false,
            description: "friendID '" + req.body.friendID + "' is not a friend of userID " + req.params.userID + "'s"
        });
    }

    let newFriends = user.friends.filter(f => f !== friend.id);

    await db.get("users").update({_id: user._id}, {$set: {friends: newFriends}});
    
    return res.status(200).json({
        success: true,
        description: `Successfully removed ${friend.displayname} as a friend.`,
        body: {
            item: friend
        }
    });
});

module.exports = router;