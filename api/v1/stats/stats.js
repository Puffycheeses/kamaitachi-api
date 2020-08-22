const db = require("../../../db.js");
const express = require("express");
const router = express.Router({mergeParams: true});
const dbCore = require("../../../core/db-core.js");
const apiConfig = require("../../../apiconfig.js");

// mounted on api/v1/stats

const STAT_LIMIT = 50;

async function GetScoreCounts(idObj, skip, limit, queryObj){
    queryObj = queryObj || {}

    let now = new Date();

    // month does it from the start of this month
    let monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // whereas "today" actually, is time this past 24 hours
    // people will appreciate this, maybe.
    let todayStart = now.getTime() - 86400000;

    const mainPipeline = [
        { $group: {
            _id: idObj,
            count: { $sum: 1 }
        }},
        { $sort: { count: -1 } },
        { $skip: skip },
        { $limit : limit }
    ]

    let allTimeStats = await db.get("scores").aggregate([
        { $match: queryObj },
        ...mainPipeline
    ]);

    let monthStats = await db.get("scores").aggregate([
        { $match: Object.assign({}, queryObj, { timeAchieved: {$gt: monthStart } }) },
        ...mainPipeline
    ]);

    let todayStats = await db.get("scores").aggregate([
        { $match: Object.assign({}, queryObj, { timeAchieved: {$gt: todayStart } }) },
        ...mainPipeline
    ]);

    return {
        alltime: allTimeStats,
        month: monthStats,
        today: todayStats
    }
}

router.get("/score-counts", async function(req,res) {
    let queryObj = {};

    let validKeys = apiConfig.validKeys.scores;

    // mutates queryObj to have params we care about safely.
    try {
        dbCore.FancyQueryValidate(req.query, queryObj, validKeys);
    }
    catch (r){
        if (r.statusCode && r.body){
            return res.status(r.statusCode).json(r.body);
        }
        console.error(r);
        return res.status(500).json({
            success: false,
            description: "An internal server error has occured."
        });
    }

    let skip = parseInt(req.query.skip) || 0;
    let limit = parseInt(req.query.limit) < STAT_LIMIT ? parseInt(req.query.limit) : STAT_LIMIT;

    let groupConcat = {
        game: "$game",
        songID: "$songID"
    }

    if (req.query.separateCharts && req.query.separateCharts === "true"){
        groupConcat.scoreData = {
            difficulty: "$scoreData.difficulty",
            playtype: "$scoreData.playtype"
        }
    }

    let scoreCounts = await GetScoreCounts(groupConcat, skip, limit, queryObj);

    let rBody = {
        scoreCounts
    }
    
    if (req.query.getAssocData && req.query.getAssocData === "true"){
        let songData = {};
        let gameSongIDs = {

        };
        for (const key in scoreCounts) {
            for (const result of scoreCounts[key]) {
                if (!gameSongIDs[result._id.game]){
                    gameSongIDs[result._id.game] = [result._id.songID];
                }
                else {
                    gameSongIDs[result._id.game].push(result._id.songID);
                }
            }
        }

        for (const game in gameSongIDs) {
            songData[game] = await db.get("songs-" + game).find({
                id: {$in: gameSongIDs[game]}
            });
        }

        rBody.songData = songData;
    }

    return res.status(200).json({
        success: true,
        body: rBody
    })
});

module.exports = router;