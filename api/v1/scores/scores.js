const db = require("../../../db.js");
const express = require("express");
const router = express.Router({mergeParams: true});
const scoreHelpers = require("../../../helpers/scorehelpers.js");
const config = require("../../../config/config.js");
const middlewares = require("../../../middlewares.js");

// mounted on /api/v1/scores

router.get("/", async function(req,res){
    let scoreCount = await db.get("scores").count({});
    let gameCount = {}
    for (const game of config.supportedGames) {
        gameCount[game] = await db.get("scores").count({game: game});
    }
    return res.status(200).json({
        success: true,
        description: "Kamaitachi is live and powering " + scoreCount + " scores.",
        body:{
            scoreCount: scoreCount,
            gameCount: gameCount
        }
    });
});

router.get("/:userID/best", middlewares.RequireExistingUser, async function(req,res){
    if (!config.supportedGames.includes(req.query.game)){
        return res.status(400).json({
            success: false,
            description: "This game is not supported, or one was not provided."
        });
    }

    if (!config.validPlaytypes[req.query.game].includes(req.query.playtype)){
        return res.status(400).json({
            success: false,
            description: "This playtype is not supported, or one was not provided."
        });
    }

    let startPoint = 0;

    if (Number.isInteger(parseInt(req.query.start))){
        startPoint = parseInt(req.query.start);
    }

    // else if we get here we're all good

    let bestScores = await db.get("scores").find({
        userID: parseInt(req.params.userID),
        game: req.query.game,
        "scoreData.playtype": req.query.playtype,
        isScorePB: true,
        validity: {$ne: "invalid"}
    },
    {
        sort: {"calculatedData.rating": -1},
        limit: 100,
        start: startPoint
    });

    if (req.query.autocoerce !== "false"){
        bestScores = await scoreHelpers.AutoCoerce(bestScores);
    }

    let rivalGroup = await db.get("rivals").findOne({
        game: req.query.game,
        playtype: req.query.playtype,
        isDefault: true
    });

    // monkey patch rankings on
    for (const score of bestScores) {
        let otherScores = await db.get("scores").find({
            songID: score.songID,
            "scoreData.difficulty": score.scoreData.difficulty,
            "scoreData.playtype": score.scoreData.playtype,
            isScorePB: true,
        },
        {
            sort: {"calculatedData.rating": -1}
        });

        let scoreIDs = otherScores.map(e => e.scoreID);

        if (rivalGroup){
            let rgScoreIDs = otherScores.filter(e => rivalGroup.members.includes(e.userID)).map(e => e.scoreID);

            score.rgRanking = rgScoreIDs.indexOf(score.scoreID) + 1;
            if (!score.rgRanking){
                score.ranking = "N/A";
            }
        }
        
        score.ranking = scoreIDs.indexOf(score.scoreID) + 1;
        if (!score.ranking){
            score.ranking = "N/A";
        }
    }

    if (bestScores.length === 0){
        return res.status(200).json({
            success: true,
            description: "This user has no scores.",
            body: {
                scores: [],
                songs: [],
                charts: []
            }
        });
    }

    let songs = await db.get("songs-" + req.query.game).find({id: {$in: bestScores.map(e => e.songID)}});

    let charts = await db.get("charts-" + req.query.game).find({
        $or: bestScores.map(e => ({
            id: e.songID,
            difficulty: e.scoreData.difficulty,
            playtype: e.scoreData.playtype
        }))
    })

    return res.status(200).json({
        success: true,
        description: "Found " + bestScores.length + " scores.",
        body: {
            scores: bestScores,
            songs: songs,
            charts: charts,
        }
    });
});

router.get("/query", async function(req,res){
    let scoreBody = await scoreHelpers.GetScoresWithQuery(req.query, res);

    // check if this was an actual scorebody or just some hacky res nonsense,
    // sorry for the poor code here, needs refactoring - zkldi.
    if (scoreBody.scores){
        return res.status(200).json({
            success: true,
            description: "Successfully retrieved " + scoreBody.scores.length + " scores.",
            body: scoreBody
        });
    }
});

module.exports = router; 