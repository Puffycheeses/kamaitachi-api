const express = require("express");
const router = express.Router({mergeParams: true});
const middlewares = require("../../../middlewares.js");
const db = require("../../../db.js");
const userHelpers = require("../../../core/user-core.js");
const apiConfig = require("../../../apiconfig.js");
const similarity = require("string-similarity");

// mounted on /api/v1/users

const MAX_USER_RETURN_LIMIT = 100;
const ALLOWED_SORT_CRITERIA = ["id","xp","username","displayname"];

router.get("/", async function(req,res){
    let rgxIsNum = /^[0-9]+$/;
    let userLimit = MAX_USER_RETURN_LIMIT;
    if (req.query.limit){
        if (!rgxIsNum.match(req.query.limit)){
            return res.status(400).json({
                success: false,
                description: "userLimit is not an integer."
            });
        }

        if (parseInt(req.query.limit) > MAX_USER_RETURN_LIMIT){
            return res.status(400).json({
                success: false,
                description: "userLimit is greater than MAX_USER_RETURN_LIMIT, which is " + MAX_USER_RETURN_LIMIT
            })
        }

        userLimit = req.query.limit;
    }

    let start = 0;
    if (req.query.start){
        if (!rgxIsNum.match(req.query.start)){
            return res.status(400).json({
                success: false,
                description: "start is not an integer."
            });
        }

        start = parseInt(req.query.start);
    }

    let sortCriteria = "id";
    if (req.query.sortCriteria){
        if (!ALLOWED_SORT_CRITERIA.includes(req.query.sortCriteria)){
            return res.status(400).json({
                success: false,
                description: "sortCriteria provided is not allowed. Refer to the documentation."
            })
        }
        sortCriteria = req.query.sortCriteria
    }

    let users = await db.get("users").find({}, {projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS, limit : userLimit, skip: start, sort : sortCriteria });

    let usersBody = {items: users};
    if (users.length !== 0){
        usersBody.nextStartPoint = start + userLimit;
    }

    return res.status(200).json({
        success: true,
        description: "Successfully found " + users.length + " users.",
        body: usersBody
    });
});

router.get("/online", async function(req,res){
    let userLimit = MAX_USER_RETURN_LIMIT;
    if (req.query.limit){
        if (!rgxIsNum.match(req.query.limit)){
            return res.status(400).json({
                success: false,
                description: "userLimit is not an integer."
            });
        }

        if (parseInt(req.query.limit) > MAX_USER_RETURN_LIMIT){
            return res.status(400).json({
                success: false,
                description: "userLimit is greater than MAX_USER_RETURN_LIMIT, which is " + MAX_USER_RETURN_LIMIT
            })
        }

        userLimit = req.query.limit;
    }

    let start = 0;
    if (req.query.start){
        if (!rgxIsNum.match(req.query.start)){
            return res.status(400).json({
                success: false,
                description: "start is not an integer."
            });
        }

        start = parseInt(req.query.start);
    }
    
    let curTime = Date.now();

    let onlineUsers = await db.get("users").find({
        lastSeen: {
            $gt: curTime - apiConfig.TIME_DELTA_ONLINE
        }
    },
        {
            projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS,
            skip: start,
            limit: userLimit
        }
    );

    let usersBody = {items: onlineUsers};
    if (onlineUsers.length !== 0){
        usersBody.nextStartPoint = start + userLimit;
    }

    return res.status(200).json({
        success: true,
        description: "There are " + onlineUsers.length + " user(s) online.",
        body: usersBody
    })
});

router.get("/search", async function(req,res){
    if (!req.query.username){
        return res.status(400).json({
            success: false,
            description: "No Username provided."
        });
    }

    if (req.query.exact){
        let user = await userHelpers.GetUser(req.query.username);

        if (!user){
            return res.status(404).json({
                success: false,
                description: "User '" + req.query.username + "' not found."
            })
        }
        return res.status(200).json({
            success: true,
            description: "Successfully found user '" + req.query.username + "'.",
            body: {
                user: user
            }
        })
    }

    // todo, this sucks and is slow.
    let users = await userHelpers.GetAllUsers();
    
    for (const user of users) {
        user.closeness = similarity.compareTwoStrings(user.username.toLowerCase(), req.query.username.toLowerCase());
    }

    // remove users where their closeness is 0, i.e. they do not match
    users = users.filter(e => !!e.closeness);

    if (users.length === 0){
        return res.status(404).json({
            success: false,
            description: "Found no similar usernames for " + req.query.username + "."
        });
    }

    if (req.query.limit) {
        let intLimit = parseInt(req.query.limit);

        if (intLimit < 0 || isNaN(intLimit) || !isFinite(intLimit) || intLimit > MAX_USER_RETURN_LIMIT) {
            return res.status(400).json({
                success: false,
                description: `Invalid limit, must be a +ve integer less than ${MAX_USER_RETURN_LIMIT}`
            })
        }

        users = users.slice(0, intLimit);
    }
    else {
        // return only the closest 100 matches. This doesn't matter now, but it might.
        users = users.slice(0, MAX_USER_RETURN_LIMIT);
    }

    users.sort((a,b) => b.closeness - a.closeness);

    return res.status(200).json({
        success: true,
        description: "Successfully found " + users.length + " similar usernames.",
        body:{
            items: users
        }
    })
});

// mounts
const userIDRouter = require("./userID/userID.js");
router.use("/:userID", userIDRouter);


module.exports = router;