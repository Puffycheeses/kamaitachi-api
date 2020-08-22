const express = require("express");
const dbHelpers = require("../../../core/db-core.js");
const router = express.Router({mergeParams: true});
const db = require("../../../db.js");

// mounted on /api/v1/imports

const MAX_RETURNS = 100;
router.get("/", async function(req,res){
    let dbRes = await dbHelpers.FancyDBQuery(
        "imports",
        req.query,
        true,
        MAX_RETURNS
    );

    return res.status(dbRes.statusCode).json(dbRes.body);
});

async function GetImportWithID(req,res,next){
    let importObj = await db.get("imports").findOne({
        importID: req.params.importID
    });

    if (!importObj){
        return res.status(400).json({
            success: false,
            description: "Import with ID " + req.params.importID + " could not be found."
        });
    }

    req.importObj = importObj;
    next();
}

router.get("/:importID", GetImportWithID, async function(req,res){
    let importObj = req.importObj

    return res.status(200).json({
        success: true,
        description: "Found import successfully.",
        body: importObj
    });
});

router.get("/:importID/scores", GetImportWithID, async function(req,res){
    let importObj = req.importObj;

    let start = parseInt(req.query.start) || 0;

    let limit = parseInt(req.query.limit) || 500;

    if (limit > 500){
        limit = 500;
    }

    let scoreIDs = importObj.successfulScores.slice(start, start + limit);

    let scores = await db.get("scores").find({
        scoreID: {$in: scoreIDs}
    });

    if (req.query.getAssocData){
        let songs = await db.get("songs-" + importObj.game).find({
            id: {$in: scores.map(e => e.songID)}
        });

        let charts = [];
        if (scores.length !== 0){
            charts = await db.get("charts-" + importObj.game).find({
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

        if (start + limit < importObj.successfulScores.length){
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

        if (start + limit < importObj.successfulScores.length){
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