const express = require("express");
const router = express.Router({mergeParams: true});
const middlewares = require("../../../../../middlewares.js");
const userHelpers = require("../../../../../core/user-core.js");
const apiConfig = require("../../../../../apiconfig.js");
const db = require("../../../../../db.js");
const dbHelpers = require("../../../../../core/db-core.js");
// mounted on /api/v1/users/:userID/sessions

router.use(middlewares.RequireExistingUser);

const MAX_RETURNS = 100;
router.get("/", async function(req,res){

    let user = req.user;
    req.query.userID = "" + user.id;

    let dbRes = await dbHelpers.FancyDBQuery(
        "sessions",
        req.query,
        true,
        MAX_RETURNS
    );

    return res.status(dbRes.statusCode).json(dbRes.body);
});

router.patch("/:sessionID/change-name", middlewares.RequireUserKeyMatch, async function(req,res){
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

    let session = await db.get("sessions").findOne({sessionID: req.params.sessionID});

    if (!session){
        return res.status(404).json({
            success: false,
            description: "Session does not exist."
        });
    }

    if (session.userID !== req.params.userID){
        return res.status(401).json({
            success: false,
            description: "This is not your session to edit."
        });
    }

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
router.patch("/:sessionID/change-desc", middlewares.RequireUserKeyMatch, async function(req,res){
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

    let session = await db.get("sessions").findOne({sessionID: req.params.sessionID});

    if (!session){
        return res.status(404).json({
            success: false,
            description: "Session does not exist."
        });
    }

    if (session.userID !== req.params.userID){
        return res.status(401).json({
            success: false,
            description: "This is not your session to edit."
        });
    }

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

module.exports = router;