const express = require("express");
const router = express.Router({mergeParams: true});
const middlewares = require("../../../../../middlewares.js");
const userHelpers = require("../../../../../core/user-core.js");
const apiConfig = require("../../../../../apiconfig.js");
const db = require("../../../../../db.js");
const dbCore = require("../../../../../core/db-core.js");
// mounted on /api/v1/users/:userID/sessions

router.use(middlewares.RequireExistingUser);

async function ValidateSessionExists(req,res,next){
    let session = await db.get("sessions").findOne({sessionID: req.params.sessionID});

    if (!session){
        return res.status(404).json({
            success: false,
            description: "Session does not exist."
        });
    }

    req.gamesession = session;

    next();
}

const MAX_RETURNS = 100;
router.get("/", async function(req,res){

    let user = req.requestedUser;
    req.query.userID = "" + user.id;

    try {
        let dbRes = await dbCore.FancyDBQuery(
            "sessions",
            req.query,
            true,
            MAX_RETURNS
        );
        return res.status(dbRes.statusCode).json(dbRes.body);
    }
    catch (r) {
        if (r.statusCode && r.body){
            return res.status(r.statusCode).json(r.body);
        }
        else {
            console.error(req.originalUrl);
            console.error(r);
            return res.status(500).json({
                success: false,
                description: "An unknown internal server error has occured."
            });
        }
    }
});

router.patch("/:sessionID/change-name", middlewares.RequireUserKeyMatch, ValidateSessionExists, async function(req,res){
    if (!req.query.name){
        return res.status(400).json({
            success: false,
            description: "No name provided."
        });
    }
    if (req.query.name.length > 140){
        return res.status(400).json({
            success: false,
            description: "Session names cannot be longer than 140 characters."
        });
    }

    let session = req.gamesession;

    await db.get("sessions").update({_id: session._id}, {$set: {name: req.query.name}});

    return res.status(200).json({
        success: true,
        description: "Successfully changed session name from " + session.name + " to " + req.query.name + ".",
        body: {
            oldName: session.name,
            newName: req.query.name
        }
    });
});

// TODO, NOT COPY PASTE THIS, LOL.
router.patch("/:sessionID/change-desc", middlewares.RequireUserKeyMatch, ValidateSessionExists, async function(req,res){
    if (!req.query.desc){
        return res.status(400).json({
            success: false,
            description: "No desc provided."
        });
    }
    if (req.query.desc.length > 280){
        return res.status(400).json({
            success: false,
            description: "Session descs cannot be longer than 280 characters."
        });
    }

    let session = req.gamesession;

    await db.get("sessions").update({_id: session._id}, {$set: {desc: req.query.desc}});

    return res.status(200).json({
        success: true,
        description: "Successfully changed session desc from " + session.desc + " to " + req.query.desc + ".",
        body: {
            oldDesc: session.desc,
            newDesc: req.query.desc
        }
    });
});

router.patch("/:sessionID/set-highlight", middlewares.RequireUserKeyMatch, ValidateSessionExists, async function(req,res){
    let session = req.gamesession;

    await db.get("sessions").update({_id: session._id}, {$set: {highlight: true}});

    return res.status(200).json({
        success: true,
        description: "Successfully higlighted session!",
        body: {
            // nothing
        }
    });
});

router.patch("/:sessionID/unset-highlight", middlewares.RequireUserKeyMatch, ValidateSessionExists, async function(req,res){
    let session = req.gamesession;

    await db.get("sessions").update({_id: session._id}, {$set: {highlight: false}});

    return res.status(200).json({
        success: true,
        description: "Successfully unhiglighted session!",
        body: {
            // nothing
        }
    });
});

module.exports = router;