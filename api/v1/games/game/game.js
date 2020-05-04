const db = require("../../../../db.js");
const express = require("express");
const router = express.Router({mergeParams: true});
const config = require("../../../../config/config.js");
const middlewares = require("../../../../middlewares.js");
const userHelpers = require("../../../../helpers/userhelpers.js");

// mounted on /api/v1/games/:game

router.use(middlewares.RequireValidGame);

router.get("/", async function(req,res){
    let scoreCount = await db.get("scores").count({game: req.params.game});
    let songCount = await db.get("songs-" + req.params.game).count({});
    let chartCount = await db.get("charts-" + req.params.game).count({});
    let players = {}
    let game = req.params.game;
    for (const playtype of config.validPlaytypes[req.params.game]) {
        let pCount = await userHelpers.GetPlayersOnGame(game, playtype);
        players[playtype] = pCount;
    }

    let gameObj = {
        game: game,
        gameHuman: config.GameToHuman(game),
        validPlaytypes: config.validPlaytypes[game],
        versions: config.gameOrders[game],
        versionsHuman: config.versionHuman[game],
        defaultPlaytype: config.defaultPlaytype[game],
        grades: config.grades[game],
        gradeBoundaries: config.gradeBoundaries[game],
        folders: config.folders[game],
        lamps: config.lamps[game],
        clearLamp: config.clearLamp[game],
        chartIndicators: config.gameChartIndicators[game],
        ratingParameters: config.ratingParameters[game]
    }

    let gameStats = {
        scoreCount: scoreCount,
        songCount: songCount,
        chartCount: chartCount,
        players
    }

    return res.status(200).json({
        success: true,
        description: "Information retrieved for " + req.params.game +".",
        body: {
            gameInfo: gameObj,
            gameStats: gameStats
        }
    });
});

// mounts
const songsRouter = require("./songs/songs.js");
const foldersRouter = require("./folders/folders.js");
const chartsRouter = require("./charts/charts.js");

router.use("/songs", songsRouter);
router.use("/folders/:folderType", foldersRouter);
router.use("/charts", chartsRouter);

module.exports = router;