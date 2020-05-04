const express = require("express");
const db = require("../../../../../db.js");
const router = express.Router({mergeParams: true});
const userHelpers = require("../../../../../helpers/userhelpers.js");
const middlewares = require("../../../../../middlewares.js");
const friendHelpers = require("./helpers.js");

// mounted on /api/v1/users/:userID/friends

router.get("/", async function(req,res){
    let user = await userHelpers.GetUser(req.params.userID);
    return res.status(200).json({
        success: true,
        description: "Successfully found friends of user '" + req.params.userID + "'",
        body: {
            friendIDs: user.friends
        }
    });
});

router.get("/online", async function(req,res){
    let user = await userHelpers.GetUser(req.params.userID);

    let onlineStatum = user.friends.map(f => userHelpers.IsUserIDOnline(f));

    onlineStatum = await Promise.all(onlineStatum);

    let onlineFriends = user.friends.filter((f,i) => onlineStatum[i])

    return res.status(200).json({
        success: true,
        description: "Successfully found friends of user '" + req.params.userID + "'",
        body: {
            friendIDs: onlineFriends
        }
    });
});

router.patch("/add", middlewares.RequireUserKeyMatch, async function(req,res){
    let friend = await friendHelpers.GetFriend(req.body.friendID);
    let user = await userHelpers.GetUser(req.params.userID);

    await db.get("users").update({_id: user._id}, {$push: {friends: friend.id}});
    
    return res.status(201).json({
        success: true,
        description: "Successfully added friendID '" + req.body.friendID + "' to user '" + req.params.userID + "'"
    });
});

router.patch("/remove", middlewares.RequireUserKeyMatch, async function(req,res){
    let friend = await friendHelpers.GetFriend(req.body.friendID);
    let user = await userHelpers.GetUser(req.params.userID);

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
        description: "Successfully removed friendID '" + req.body.friendID + "' from user '" + req.params.userID + "'"
    });
});

module.exports = router;