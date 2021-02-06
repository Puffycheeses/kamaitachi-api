import * as express from "express";
const router = express.Router({ mergeParams: true });
import dbCore from "../../../../../core/db-core";
import db from "../../../../../db";
import regexSanitise from "escape-string-regexp";

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
    let dbRes = await dbCore.NBQuery<SongDocument>(
        `songs-${req.params.game}` as ValidDatabases,
        req.query,
        true,
        MAX_RETURNS,
        "songs"
    );

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

/**
 * Performs a search on the songs database for this game.
 * @name GET /v1/games/:game/songs/search
 * @param exact Only search for *exact* matches.
 * @param minimalReturns Only returns minimal information about the song, for real-time
 * search implementations.
 * @param title - The song.
 */
router.get("/search", async (req: KTRequest, res) => {
    let r: SongDocument[];

    let titleRegex = new RegExp(regexSanitise(req.query.title), "i");
    let settings = {};

    if (req.query.minimalReturns === "true") {
        settings = {
            projection: {
                title: 1,
                artist: 1,
                id: 1,
            },
        };
    }

    r = await db.get(`songs-${req.params.game}`).find(
        {
            $or: [
                { artist: titleRegex },
                { title: titleRegex },
                { "alt-titles": titleRegex },
                { "search-titles": titleRegex },
            ],
        },
        settings
    );

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
