const db = require("../../../db.js");
const express = require("express");
const router = express.Router({mergeParams: true});
const config = require("../../../config/config.js");
const userHelpers = require("../../../core/user-core.js");

// mounted on /api/v1/games

let gamesResponseCache = null;
const ONE_HOUR = 1000 * 60 * 60;

router.get("/", async function(req,res){
    if (gamesResponseCache && (gamesResponseCache.timestamp + ONE_HOUR) < Date.now()) {
        return res.status(200).json({
            success: true,
            description: "Retrieved v1/games cache.",
            body: gamesResponseCache.data
        });
    }

    let gamesObj = {};
    let totalScoreCount = 0;
    let totalSongCount = 0;
    let totalChartCount = 0;

    let scoresByGame = await db.get("scores").aggregate([
        {
            $group: {
                _id: "$game",
                count: {$sum: 1}
            }
        }
    ]);

    let scoresGame = {};

    for (const item of scoresByGame) {
        scoresGame[item._id] = item.count;
    }

    for (const game of config.supportedGames) {
        let scoreCount = scoresGame[game] || 0;
        let songCount = await db.get("songs-" + game).count({});
        let chartCount = await db.get("charts-" + game).count({});

        totalScoreCount += scoreCount;
        totalSongCount += songCount;
        totalChartCount += chartCount;

        let gameObj = {
            game: game,
            playtypes: config.validPlaytypes[game],
            gameHuman: config.gameHuman[game],
            scoreCount: scoreCount,
            songCount: songCount,
            chartCount: chartCount
        }
        gamesObj[game] = gameObj;
    }

    gamesResponseCache = {
        timestamp: Date.now(),
        data: {
            gameStats: gamesObj,
            totalScoreCount,
            totalSongCount,
            totalChartCount
        }
    }

    return res.status(201).json({
        success: true,
        description: "Kamaitachi is currently powering " + config.supportedGames.length + " games.",
        body: {
            gameStats: gamesObj,
            totalScoreCount,
            totalSongCount,
            totalChartCount,
        }
    })
});

// mounts
const gameRouter = require("./game/game.js");

router.use("/:game", gameRouter);

module.exports = router;