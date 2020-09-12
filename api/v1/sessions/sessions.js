const express = require("express");
const dbHelpers = require("../../../core/db-core.js");
const router = express.Router({mergeParams: true});
const db = require("../../../db.js");

// mounted on /api/v1/sessions

const MAX_RETURNS = 100;
router.get("/", async function(req,res){
    try {
        let dbRes = await dbHelpers.FancyDBQuery(
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