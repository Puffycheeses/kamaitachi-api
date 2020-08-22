const db = require("../db.js");
const config = require("../config/config.js");
const apiConfig = require("../apiconfig.js");

const ALLOWED_SORT_CRITERIA = ["timeAchieved","timeAdded","scoreData.score","scoreData.percent","calculatedData.rating","calculatedData.notability","xp"];
const SCOREDATA_KEYS = ["playtype","difficulty","grade","lamp"];
const MAX_SCORE_LIMIT = 100;

async function AutoCoerce(scores){
    let notPBs = scores.filter(e => !e.isLampPB);
    if (notPBs.length === 0){
        return scores;
    }

    let lampPBsArr = await db.get("scores").find({
        $or: notPBs.map(s => ({
            userID: s.userID,
            songID: s.songID,
            "scoreData.playtype": s.scoreData.playtype,
            "scoreData.difficulty": s.scoreData.difficulty,
            isLampPB: true
        }))
    });

    let lampPBs = {}
    for (const score of lampPBsArr) {
        lampPBs[score.userID + "-" + score.songID + "-" + score.scoreData.playtype + "-" + score.game + "-" + score.scoreData.playtype + "-" + score.scoreData.difficulty] = score;
    }
    
    for (const score of scores) {
        if (!score.isLampPB){

            /* unused slow code, dw about it - zkldi
            let lampPB = await db.get("scores").findOne({
                userID: score.userID,
                game: score.game,
                "scoreData.playtype": score.scoreData.playtype,
                "scoreData.difficulty": score.scoreData.difficulty,
                isLampPB: true,
            });
            */

            let lampPB = lampPBs[score.userID + "-" + score.songID + "-" + score.scoreData.playtype + "-" + score.game + "-" + score.scoreData.playtype + "-" + score.scoreData.difficulty];

            if (lampPB){
                score.scoreData.lamp = lampPB.scoreData.lamp;
                score.isLampPB = true;
            }
        }
    }

    return scores;
}


async function GetScoresWithQuery(query, res){

    // queryObj generation
    let queryObj = {};

    if (query.userID){
        queryObj.userID = parseInt(query.userID);
    }
    // pagination support
    let scoreLimit = parseInt(query.limit) < 100 ? parseInt(query.limit) : MAX_SCORE_LIMIT;
    let rgxIsNum = /^[0-9]+$/;
    if (query.scoreLimit){
        if (!rgxIsNum.match(query.scoreLimit)){
            return res.status(400).json({
                success: false,
                description: "scoreLimit is not an integer."
            });
        }

        if (parseInt(query.scoreLimit) > MAX_SCORE_LIMIT){
            return res.status(400).json({
                success: false,
                description: "scoreLimit is greater than MAX_SCORE_LIMIT, which is " + MAX_SCORE_LIMIT
            })
        }

        scoreLimit = parseInt(query.scoreLimit)
    }

    let start = 0;

    if (query.start){
        if (!rgxIsNum.match(query.start)){
            return res.status(400).json({
                success: false,
                description: "start is not an integer."
            });
        }

        start = parseInt(query.start);
    }

    // sort on criteria
    let sortCriteria = {"timeAdded": -1}; // default
    if (query.sortCriteria){
        if (!ALLOWED_SORT_CRITERIA.includes(query.sortCriteria)){
            return res.status(400).json({
                success: false,
                description: "sortCriteria provided is not allowed. Refer to the documentation."
            })
        }

        sortCriteria = {[query.sortCriteria]: query.reverse ? -1 : 1};

        // issue: sorting with mongo results in null values being sorted first, ideally, we'd like to exclude those from the results
        // we *should* do something like {$ne: null} here...
        // ...but, due to an issue with score importing, NaN is actually the value of a lot of these should-be-null values.
        // for now, {$gt: 0} works fine, BUT, in the future this should be fixed, with a refactor of scoreimporting - zkldi.

        // queryObj[query.sortCriteria] = {$ne: null};
        queryObj[query.sortCriteria] = {$gt: 0};
    }

    if (query.game){
        if (!config.supportedGames.includes(query.game)){
            return res.status(400).json({
                success: false,
                description: "The game " + query.game + " is not supported."
            });
        }
        queryObj.game = query.game;
    }

    if (query.service){
        queryObj.service = query.service;
    }

    if (query.songID){
        if (!rgxIsNum.match(query.scoreLimit)){
            return res.status(400).json({
                success: false,
                description: "songID is not an integer."
            });
        }
        queryObj.songID = query.songID;
    }

    // scoredata stuffs
    for (const key of SCOREDATA_KEYS) {
        if (query[key]){
            queryObj["scoreData." + key] = query[key];
        }
    }

    let scores = [];
    
    if (query.unique && query.unique !== "false"){
        queryOBJ.isScorePB = true;
        scores = await db.get("scores").find(queryObj, {fields: {_id: 0}, limit : scoreLimit, skip: start, sort : sortCriteria });
        for (const score of scores) {
            if (!score.isLampPB){
                let lampPB = await db.get("scores").findOne({
                    songID: score.songID,
                    game: score.game,
                    "scoreData.difficulty": score.scoreData.difficulty,
                    "scoreData.playtype": score.scoreData.playtype,
                    isLampPB: true
                });

                if (!lampPB){
                    // ???? should be unreachable state
                    // Honestly, we'll just silently fail to the user and go on.
                    console.error("[WARN] NO LAMP PB FOUND FOR " + score.scoreID + ".");
                }
                else {
                    score.scoreData.lamp = lampPB.scoreData.lamp;
                    score.scoredata.isLampPB = true;
                }
            }
        }
    }
    else {
        scores = await db.get("scores").find(queryObj, {fields: {_id: 0}, limit : scoreLimit, skip: start, sort : sortCriteria });
    }

    let scoreBody = {scores: scores}
    if (scores.length !== 0) {
        scoreBody.nextStartPoint = start + scoreLimit;

        if (query.getAssocData && query.getAssocData !== "false") {
            if (!query.game){
                let chartQuery = {};
                let songQuery = {};
    
                for (const e of scores) {
                    if (!chartQuery[e.game]){
                        songQuery[e.game] = [];
                        chartQuery[e.game] = [];
                    }
                    chartQuery[e.game].push({
                        id: e.songID,
                        difficulty: e.scoreData.difficulty,
                        playtype: e.scoreData.playtype
                    });
                    
                    songQuery[e.game].push(e.songID);
                }
    
                let chartRet = {};
                let songsRet = {};
    
                for (const key in songQuery) {
                    let charts = await db.get("charts-" + key).find({
                        $or: chartQuery[key]
                    }, {
                        fields: {_id: 0}
                    });
                    let songs = await db.get("songs-" + key).find({
                        id: {$in: songQuery[key]}
                    }, {
                        fields: {_id: 0}
                    });
    
                    songsRet[key] = songs;
                    chartRet[key] = charts;
                }
    
                let users = await db.get("users").find({
                    id: {$in: scores.map(e => e.userID)}
                }, {
                    fields: apiConfig.REMOVE_PRIVATE_USER_RETURNS
                });
    
                scoreBody.charts = chartRet;
                scoreBody.songs = songsRet;
                scoreBody.users = users;
            }
            else {
                let chartQuery = [];
                let songQuery = [];
    
                for (const e of scores) {
                    chartQuery.push({
                        id: e.songID,
                        difficulty: e.scoreData.difficulty,
                        playtype: e.scoreData.playtype
                    });
                    
                    songQuery.push(e.songID);
                }
                let chartRet = await db.get("charts-" + query.game).find({
                    $or: chartQuery
                }, {
                    fields: {_id: 0}
                });
                let songsRet = await db.get("songs-" + query.game).find({
                    id: {$in: songQuery}
                }, {
                    fields: {_id: 0}
                });

                let users = await db.get("users").find({
                    id: {$in: scores.map(e => e.userID)}
                }, {
                    fields: apiConfig.REMOVE_PRIVATE_USER_RETURNS
                });
    
                scoreBody.charts = chartRet;
                scoreBody.songs = songsRet;
                scoreBody.users = users;
            }

        }
    }
    else {
        return res.status(404).json({
            success: false,
            description: "No data found for this query."
        });
    }

    return scoreBody;
}

module.exports = {
    GetScoresWithQuery,
    AutoCoerce
}