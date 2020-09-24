const db = require("../../../db.js");
const express = require("express");
const router = express.Router({mergeParams: true});
const config = require("../../../config/config.js");
const userHelpers = require("../../../core/user-core.js");

// mounted on /api/v1/games

router.get("/", async function(req,res){
    let gamesObj = {};
    let totalScoreCount = 0;
    let totalSongCount = 0;
    let totalChartCount = 0;
    for (const game of config.supportedGames) {
        let scoreCount = await db.get("scores").count({game: game});
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

    return res.status(200).json({
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