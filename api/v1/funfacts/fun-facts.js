const express = require("express");
const dbHelpers = require("../../../core/db-core.js");
const userCore = require("../../../core/user-core.js");
const router = express.Router({mergeParams: true});
const db = require("../../../db.js");
const crypto = require("crypto");
const middlewares = require("../../../middlewares.js");
const apiConfig = require("../../../apiconfig.js");

// mounted on /api/v1/fun-facts

router.get("/", async function(req,res){
    let requestingUser = await db.get("users").findOne({id: req.apikey.assignedTo}, {fields: apiConfig.REMOVE_PRIVATE_USER_RETURNS});

    let aggPipe = [{
        $sample: {size: 1}
    }];

    if (!requestingUser.settings.nsfwsplashes){
        aggPipe.unshift({
            $match: {nsfw: false}
        });
    }
    
    let ffact = await db.get("fun-facts").aggregate(aggPipe);

    ffact = ffact[0];

    if (!ffact){
        return res.status(400).json({
            success: false,
            description: "Did not find any fun facts."
        });
    }

    let user = null;
    if (ffact.anonymous){
        delete ffact.userID
    }
    else {
        user = await db.get("users").findOne({
            id: ffact.userID
        }, {
            fields: apiConfig.REMOVE_PRIVATE_USER_RETURNS
        });
    }

    return res.status(200).json({
        success: true,
        description: "Successfully found a fun fact.",
        body: {
            fact: ffact,
            user
        }
    });
});

router.put("/submit-fun-fact", async function (req, res){
    if (!req.body.funfact) {
        return res.status(400).json({
            success: false,
            description: "No funfact given."
        });
    }

    if (req.body.funfact.length > 280) {
        return res.status(400).json({
            success: false,
            description: "Fun facts cannot exceed 280 characters."
        });
    }

    let exists = await db.get("fun-facts").findOne({
        text: req.body.funfact
    });

    if (exists){
        return res.status(409).json({
            success: false,
            description: "This fun fact is already in the database."
        });
    }

    let ffactObj = {
        text: req.body.funfact,
        nsfw: !!req.body.nsfw,
        anonymous: !!req.body.anonymous,
        userID: req.apikey.assignedTo,
        funfactID: crypto.randomBytes(20).toString("hex"),
        timestamp: Date.now()
    }

    await db.get("fun-facts").insert(ffactObj);

    return res.status(200).json({
        success: true,
        description: "Successfully added fun fact.",
        body: ffactObj
    });
});

module.exports = router;