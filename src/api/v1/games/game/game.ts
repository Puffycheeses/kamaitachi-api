const db = require("../../../../db.js");
import * as express from "express";
const router = express.Router({ mergeParams: true });
const config = require("../../../../config/config.js");
const middlewares = require("../../../../middlewares.js");
const userHelpers = require("../../../../core/user-core.js");

// mounted on /api/v1/games/:game

router.use(middlewares.RequireValidGame);

router.get("/", async function (req, res) {
    let scoreCount = await db.get("scores").count({ game: req.params.game });
    let songCount = await db.get(`songs-${req.params.game}`).count({});
    let chartCount = await db.get(`charts-${req.params.game}`).count({});
    let game = req.params.game;

    let gameObj = {
        game: game,
        gameHuman: config.gameHuman[game],
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
        ratingParameters: config.ratingParameters[game],
    };

    let gameStats = {
        scoreCount: scoreCount,
        songCount: songCount,
        chartCount: chartCount,
    };

    return res.status(200).json({
        success: true,
        description: `Information retrieved for ${req.params.game}.`,
        body: {
            gameInfo: gameObj,
            gameStats: gameStats,
        },
    });
});

router.get("/playercount", async function (req, res) {
    let playtypes = config.validPlaytypes[req.params.game];

    let ret = {};

    for (const pt of playtypes) {
        let players = await db.get("users").count({
            [`ratings.${req.params.game}.${pt}`]: { $gt: 0 },
        });

        ret[pt] = players;
    }

    return res.status(200).json({
        success: true,
        description: `Found players for ${req.params.game}`,
        body: ret,
    });
});

// mounts
const songsRouter = require("./songs/songs.js");
const chartsRouter = require("./charts/charts.js");

router.use("/songs", songsRouter);
router.use("/charts", chartsRouter);

module.exports = router;