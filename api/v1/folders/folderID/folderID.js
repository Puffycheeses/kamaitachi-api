const express = require("express");
const dbHelpers = require("../../../../core/db-core.js");
const router = express.Router({mergeParams: true});
const db = require("../../../../db.js");
const config = require("../../../../config/config.js");
const scoreCore = require("../../../../core/score-core.js");
const folderCore = require("../../../../core/folder-core.js");

// mounted on /api/v1/folders/:folderID

async function RequireValidFolderID(req, res, next){
    let folder = await db.get("folders").findOne({
        folderID: req.params.folderID
    });

    if (!folder){
        return res.status(404).json({
            success: false,
            description: "This folder does not exist."
        });
    }

    req.folderData = folder;

    db.get("folders").update({
        _id: folder._id
    }, {
        $inc: {"views": 1}
    })

    next();
}

router.use(RequireValidFolderID);

router.get("/", async function(req,res){
    return res.status(200).json({
        success: true,
        description: `Successfully found ${req.folderData.title}.`,
        body: req.folderData
    });
});

async function ValidateUserID(req, res, next){
    if (parseInt(req.query.userID)){
        let u = await db.get("users").findOne({id: parseInt(req.query.userID)}, {fields: {password: 0, email: 0, integrations: 0}});

        if (u){
            req.requestedUserID = u.id;
        }
        else {
            return res.status(404).json({
                success: false,
                description: `No user with the id ${req.query.userID} could be found.`
            })
        }
    }
    else {
        req.requestedUserID = req.apikey.assignedTo;
    }

    next();
}

async function ValidateRivalGroupID(req, res, next){
    if (req.query.rivalGroupID){
        let rg = await db.get("rivals").findOne({rivalGroupID: req.query.rivalGroupID});

        if (rg){
            req.rivalGroup = rg;
        }
        else {
            return res.status(404).json({
                success: false,
                description: `No rivalgroup with the id ${req.query.rivalGroupID} could be found.`
            });
        }
    }
    
    next();
}

router.get("/scores", ValidateUserID, ValidateRivalGroupID, async function(req,res){
    console.time("folderscores");
    let folder = req.folderData;
    let requestedUserID = req.requestedUserID;

    let playtype = null;
    let difficulty = null;

    if (req.query.playtype){
        if (config.validPlaytypes[folder.game].includes(req.query.playtype)){
            playtype = req.query.playtype;
        }
        else {
            return res.status(400).json({
                success: false,
                description: `Playtype ${req.query.playtype} provided, but this was not valid for ${folder.game}.`
            });
        }
    }

    if (req.query.difficulty){
        if (config.validDifficulties[folder.game].includes(req.query.difficulty)){
            difficulty = req.query.difficulty;
        }
        else {
            return res.status(400).json({
                success: false,
                description: `Difficulty ${req.query.difficulty} provided, but this was not valid for ${folder.game}.`
            });
        }
    }

    let {songs, charts} = await folderCore.GetDataFromFolderQuery(folder, playtype, difficulty);

    let scores = [];

    if (req.rivalGroup){
        let aggScores = await db.get("scores").aggregate([
            {
                $match: {
                    chartID: {$in: charts.map(e => e.chartID)},
                    userID: {$in: req.rivalGroup.members},
                    isScorePB: true
                }
            }, 
            { 
                $sort: { "scoreData.percent": -1 } 
            },
            {
                $group: {
                    _id: "$chartID",
                    score: { $first: "$$ROOT" },
                }
            }
        ]);

        scores = aggScores.map(e => e.score);
    }
    else if (req.query.getServerRecords){

    }
    else {
        let scorePBs = await db.get("scores").find({
            chartID: {$in: charts.map(e => e.chartID)},
            userID: requestedUserID,
            isScorePB: true
        });

        scores = await scoreCore.AutoCoerce(scorePBs);
    }

    console.timeEnd("folderscores");

    return res.status(200).json({
        success: true,
        description: `Successfully found ${scores.length} scores in folder ${folder.title}`,
        body: {
            scores,
            songs,
            charts
        }
    })
});

module.exports = router;