const express = require("express");
const dbCore = require("../../../core/db-core.js");
const router = express.Router({mergeParams: true});
const db = require("../../../db.js");
const apiConfig = require("../../../apiconfig.js");

// mounted on /api/v1/sessions

const MAX_RETURNS = 100;
router.get("/", async function(req,res){
    try {
        let queryObj = {};
        if (req.query.myRivals){
            let rivalGroups = await db.get("rivals").find({
                isDefault: true,
                founderID: req.user.id
            });

            if (rivalGroups.length){
                queryObj = {
                    $or: rivalGroups.map(e => ({
                        userID: {$in: e.members.filter(m => m !== req.user.id)},
                        game: e.game,
                        playtype: e.playtype
                    })
                )}
            }
            else {
                return res.status(200).json({
                    success: true,
                    description: "No rival groups set up.",
                    body: {
                        items: [],
                        users: []
                    }
                })
            }
        }
        else if (req.query.myFriends) {
            queryObj.userID = {$in: req.user.friends}
        }

        let dbRes = await dbCore.FancyDBQuery(
            "sessions",
            req.query,
            true,
            MAX_RETURNS,
            null,
            false,
            queryObj
        );

        if (dbRes.body.success){
            if (req.query.getAssocData === "true"){
                dbRes.body.body.users = await db.get("users").find({
                    id: {$in: dbRes.body.body.items.map(e => e.userID)}
                }, {
                    fields: apiConfig.REMOVE_PRIVATE_USER_RETURNS
                });
            }
        }
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

async function GetSessionWithID(req,res,next){
    let sessionObj = await db.get("sessions").findOne({
        sessionID: req.params.sessionID
    });

    if (!sessionObj){
        return res.status(400).json({
            success: false,
            description: "session with ID " + req.params.sessionID + " could not be found."
        });
    }

    req.sessionObj = sessionObj;
    next();
}

router.get("/:sessionID", GetSessionWithID, async function(req,res){
    let sessionObj = req.sessionObj

    return res.status(200).json({
        success: true,
        description: "Found session successfully.",
        body: sessionObj
    });
});

router.get("/:sessionID/scores", GetSessionWithID, async function(req,res){
    let sessionObj = req.sessionObj;

    let start = parseInt(req.query.start) || 0;

    let limit = parseInt(req.query.limit) || 500;

    if (limit > 500){
        limit = 500;
    }

    let scoreIDs = sessionObj.scores.map(e => e.scoreID).slice(start, start + limit);

    let scores = await db.get("scores").find({
        scoreID: {$in: scoreIDs}
    });

    if (req.query.getAssocData){
        let songs = await db.get("songs-" + sessionObj.game).find({
            id: {$in: scores.map(e => e.songID)}
        });

        let charts = [];
        if (scores.length !== 0){
            charts = await db.get("charts-" + sessionObj.game).find({
                $or: scores.map(e => ({
                    id: e.songID,
                    difficulty: e.scoreData.difficulty,
                    playtype: e.scoreData.playtype
                }))
            });
        }

        let retBody = {
            songs,
            charts,
            scores
        }

        if (start + limit < sessionObj.successfulScores.length){
            retBody.nextStartPoint = start+limit;
        }

        return res.status(200).json({
            success: true,
            description: "Found " + scores.length + " scores.",
            body: retBody
        });
    }
    else {
        let retBody = {
            scores
        }

        if (start + limit < sessionObj.successfulScores.length){
            retBody.nextStartPoint = start+limit;
        }

        return res.status(200).json({
            success: true,
            description: "Found " + scores.length + " scores.",
            body: retBody
        });
    }
});

module.exports = router;