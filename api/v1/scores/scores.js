const db = require("../../../db.js");
const dbCore = require("../../../core/db-core.js");
const express = require("express");
const router = express.Router({mergeParams: true});
const scoreHelpers = require("../../../core/score-core.js");
const config = require("../../../config/config.js");
const middlewares = require("../../../middlewares.js");
const regexSanitise = require("escape-string-regexp");

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
        let ranking = await db.get("scores").count({
            songID: score.songID,
            "scoreData.difficulty": score.scoreData.difficulty,
            "scoreData.playtype": score.scoreData.playtype,
            isScorePB: true,
            "calculatedData.rating": {$gte: score.calculatedData.rating}
        },
        {
            sort: {"calculatedData.rating": -1}
        }) + 1;

        score.ranking = ranking;

        if (rivalGroup){
            let rgRanking = await db.get("scores").count({
                userID: {$in: rivalGroup.members},
                songID: score.songID,
                "scoreData.difficulty": score.scoreData.difficulty,
                "scoreData.playtype": score.scoreData.playtype,
                isScorePB: true,
                "calculatedData.rating": {$gte: score.calculatedData.rating}
            },
            {
                sort: {"calculatedData.rating": -1}
            }) + 1;
            score.rgRanking = rgRanking;
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

const SCORE_LIMIT = 100;
router.get("/query", async function(req,res){
    let baseObj = {};

    if (req.query.queryID){
        let queryObj = await db.get("queries").findOne({
            queryID: req.query.queryID
        });

        if (!queryObj){
            return res.status(400).json({
                success: false,
                description: "This query does not exist in the database."
            });
        }

        // else, hell dimension monkey patch

        for (const key in queryObj.query) {
            let realKey = key.replace(/¬/g, ".");
            req.query[realKey] = queryObj.query[key];
        }
    }

    if (req.query.autoCoerce !== "false"){
        baseObj.isScorePB = true;
    }

    if (!req.query.allowInvalid || req.query.allowInvalid !== "true"){
        baseObj.validity = {$ne: "invalid"}
    }
    if (req.query.folderID){
        let folder = await db.get("folders").findOne({
            folderID: req.query.folderID
        });

        if (!folder){
            return res.status(404).json({
                success: false,
                description: `The folder ${req.query.folderID} does not exist.`
            });
        }

        // else, lets patch this onto baseObj
    }

    if (req.query.titleSearch){
        let regex = new RegExp(regexSanitise(req.query.titleSearch), "i");

        let likeQuery = {
            $or: [
                {title: regex},
                {"alt-titles": regex}
            ]
        };

        if (req.query.game){
            let similarSongs = await db.get(`songs-${req.query.game}`).find(likeQuery);
            baseObj.songID = {
                $in: similarSongs.map(e => e.id)
            };
        }
        else {
            baseObj.$or = [];
            for (const game of config.supportedGames) {
                let similarSongs = await db.get(`songs-${game}`).find(likeQuery);

                baseObj.$or.push({
                    songID: {$in: similarSongs.map(e => e.id)},
                    game: game
                });
            }
        }
    }

    if (req.query.userID === "self" && req.user){
        req.query.userID = "" + req.user.id;
    }

    try {
        let resBody = await dbCore.FancyDBQuery(
            "scores",
            req.query,
            true,
            SCORE_LIMIT,
            false,
            false,
            baseObj
        );
    
        // there are some other options we can use if this operation is successful
        if (resBody.body.success){
            if (req.query.autoCoerce !== "false"){
                resBody.body.body.items = await scoreHelpers.AutoCoerce(resBody.body.body.items);
            }
            if (req.query.getAssocData && req.query.getAssocData !== "false") {
                resBody.body.body = await scoreHelpers.GetAssocData(resBody.body.body);
            }

            // if this was an existing query, increment popularity
            // yeah, you can trivially break this. but you shouldn't!

            if (req.query.queryID){
                // can error for all we care
                db.get("queries").update({
                    queryID: req.query.queryID
                }, {$inc: {"timesUsed": 1}});
            }
        }

        return res.status(resBody.statusCode).json(resBody.body);
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

const scoreIDRouter = require("./scoreID/scoreID.js");

router.use("/:scoreID", scoreIDRouter);

module.exports = router; 