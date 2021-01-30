import * as express from "express";
const router = express.Router({ mergeParams: true });
import middlewares from "../../../../../../middlewares";
import dbCore from "../../../../../../core/db-core";

/**
 * @namespace /v1/games/:game/songs/:songID
 */

router.use(middlewares.RequireExistingSongID);

/**
 * Returns the song at the given ID.
 * @name GET /v1/games/:game/songs/:songID
 */
router.get("/", async (req, res) => {
    let song = req.song!;

    return res.status(200).json({
        success: true,
        description: `Found song ${song.title}.`,
        body: {
            item: song,
        },
    });
});

const CHART_RET_LIMIT = 100;

interface ChartsReturn extends FancyQueryBody<ChartDocument> {
    song: SongDocument;
}

/**
 * Returns the charts that belong to the song at the given ID.
 * @name GET /v1/games/:game/songs/:songID/charts
 */
router.get("/charts", async (req: KTRequest, res) => {
    req.query.id = req.params.songID;

    let dbRes = await dbCore.FancyDBQuery(
        `charts-${req.params.game}` as ValidDatabases,
        req.query,
        true,
        CHART_RET_LIMIT,
        "charts"
    );

    if (dbRes.body.success) {
        (dbRes.body.body as ChartsReturn).song = req.song!;
    }

    return res.status(dbRes.statusCode).json(dbRes.body);
});

export default router;
