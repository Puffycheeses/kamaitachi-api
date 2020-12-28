const db = require("../db.js");
const apiConfig = require("../apiconfig.js");

async function AutoCoerce(scores){
    let notPBsArr = [];

    for (const s of scores) {
        if (!s.isLampPB){
            notPBsArr.push({
                userID: s.userID,
                chartID: s.chartID,
                isLampPB: true
            });
        }
    }
    if (notPBsArr.length === 0){
        return scores;
    }

    let lampPBsArr = await db.get("scores").find({
        $or: notPBsArr
    });

    let lampPBs = {}
    for (const score of lampPBsArr) {
        lampPBs[score.userID + "-" + score.chartID] = score;
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

            let lampPB = lampPBs[score.userID + "-" + score.chartID];

            if (lampPB){
                score.scoreData.lamp = lampPB.scoreData.lamp;
                score.scoreData.lampIndex = lampPB.scoreData.lampIndex;
                score.calculatedData.lampRating = lampPB.calculatedData.lampRating;
                if (score.game === "bms") {
                    score.calculatedData.rating = lampPB.calculatedData.rating;
                }
                score.isLampPB = true;
            }
        }
    }

    return scores;
}

async function GetAssocData(scoreBody){
    let chartQuery = {};
    let songQuery = {};

    for (const e of scoreBody.items) {
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
            projection: {_id: 0}
        });
        let songs = await db.get("songs-" + key).find({
            id: {$in: songQuery[key]}
        }, {
            projection: {_id: 0}
        });

        songsRet[key] = songs;
        chartRet[key] = charts;
    }

    let users = await db.get("users").find({
        id: {$in: scoreBody.items.map(e => e.userID)}
    }, {
        projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS
    });

    scoreBody.charts = chartRet;
    scoreBody.songs = songsRet;
    scoreBody.users = users;

    return scoreBody;
}

module.exports = {
    GetAssocData,
    AutoCoerce
}