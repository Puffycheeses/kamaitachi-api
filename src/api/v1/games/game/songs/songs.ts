import * as express from "express";
const router = express.Router({ mergeParams: true });
import dbCore from "../../../../../core/db-core";
import db from "../../../../../db";

/**
 * @namespace /v1/games/:game/songs
 */

const MAX_RETURNS = 100;

interface SongsReturn extends FancyQueryBody<SongDocument> {
    charts?: ChartDocument[];
}

/**
 * Performs a fancy query on the game's songs.
 * @name GET /v1/games/:game/songs
 * @param getAssocCharts - If present, also retrives all charts from the songs.
 */
router.get("/", async (req: KTRequest, res) => {
    let dbRes = (await dbCore.FancyDBQuery<SongDocument>(
        `songs-${req.params.game}` as ValidDatabases,
        req.query,
        true,
        MAX_RETURNS,
        "songs"
    )) as FancyQueryPseudoResponse<SongDocument>;

    if (dbRes.body.success) {
        if (req.query.getAssocCharts) {
            let charts = await db.get(`charts-${req.params.game}`).find({
                id: { $in: dbRes.body.body.items.map((e) => e.id) },
            });

            (dbRes.body.body as SongsReturn).charts = charts;
        }
    }
    return res.status(dbRes.statusCode).json(dbRes.body);
});

// DO NOT WORRY ABOUT THIS
interface TextRT extends SongDocument {
    _ts: number;
}

router.get("/search", async (req: KTRequest, res) => {
    let r: SongDocument[];

    if (req.query.exact) {
        r = await db.get(`songs-${req.params.game}`).find(
            {
                title: req.query.title,
            },
            {
                limit: 100,
            }
        );
    } else {
        let aggR: TextRT[] = await db.get(`songs-${req.params.game}`).aggregate([
            {
                $match: {
                    $text: {
                        $search: "hello",
                        $language: "en",
                    },
                },
            },
            {
                $limit: 100,
                _ts: { $meta: "textScore" },
            },
        ]);

        aggR.sort((a, b) => b._ts - a._ts);

        r = aggR;

        // todo: write some code here to remove the _ts field,
        // however, typescript really does not like that.
    }

    return res.status(200).json({
        success: true,
        description: `Found ${r.length} result(s).`,
        body: r,
    });
});

// mounts
import songIDRouter from "./songID/songID";

router.use("/:songID", songIDRouter);

export default router;
