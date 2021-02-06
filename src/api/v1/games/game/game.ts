import db from "../../../../db";
import * as express from "express";
const router = express.Router({ mergeParams: true });
import config from "../../../../config/config";
import middlewares from "../../../../middlewares";

/**
 * @namespace /v1/games/:game
 */

router.use(middlewares.RequireValidGame);

/**
 * Returns information about that specific game,
 * @name GET /v1/games/:game
 */
router.get("/", async (req, res) => {
    let scoreCount = await db.get("scores").count({ game: req.params.game });
    let songCount = await db.get(`songs-${req.params.game}`).count({});
    let chartCount = await db.get(`charts-${req.params.game}`).count({});

    return res.status(200).json({
        success: true,
        description: `Information retrieved for ${req.params.game}.`,
        body: {
            scoreCount: scoreCount,
            songCount: songCount,
            chartCount: chartCount,
        },
    });
});

/**
 * Returns the amount of players (people with non-zero ratings)
 * on the given game.
 * @name GET /v1/games/:game/playercount
 */
router.get("/playercount", async (req, res) => {
    let playtypes = config.validPlaytypes[req.params.game as Game];

    let ret: Partial<Record<Playtypes[Game], integer>> = {};

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
import songsRouter from "./songs/songs";
import chartsRouter from "./charts/charts";

router.use("/songs", songsRouter);
router.use("/charts", chartsRouter);

export default router;
