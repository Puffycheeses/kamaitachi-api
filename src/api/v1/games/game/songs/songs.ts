import * as express from "express";
const router = express.Router({ mergeParams: true });
const dbCore = require("../../../../../core/db-core.js");
const db = require("../../../../../db.js");
const regexSanitise = require("escape-string-regexp");
const similar = require("string-similarity");
// mounted on /api/v1/games/:game/songs

const MAX_RETURNS = 100;

router.get("/", async function (req, res) {
    try {
        let dbRes = await dbCore.FancyDBQuery(`songs-${req.params.game}`, req.query, true, MAX_RETURNS, "songs");

        if (dbRes.body.success) {
            if (req.query.getAssocCharts) {
                let charts = await db.get(`charts-${req.params.game}`).find({
                    id: { $in: dbRes.body.body.items.map((e) => e.id) },
                });

                dbRes.body.body.charts = charts;
            }
        }
        return res.status(dbRes.statusCode).json(dbRes.body);
    } catch (r) {
        if (r.statusCode && r.body) {
            return res.status(r.statusCode).json(r.body);
        } else {
            console.error(req.originalUrl);
            console.error(r);
            return res.status(500).json({
                success: false,
                description: "An unknown internal server error has occured.",
            });
        }
    }
});

// NOTE: this is disgustingly inefficient.
// CAN SERIOUSLY BE OPTIMISED - zkldi
router.get("/search", async function (req, res) {
    let search = regexSanitise(req.query.title || "");
    let searchCriteria = search;
    if (!req.query.exact) {
        searchCriteria = new RegExp(`${search}`, "i");
    }

    let r = await db.get(`songs-${req.params.game}`).find(
        {
            $or: [{ title: searchCriteria }, { "alt-titles": searchCriteria }, { "search-titles": searchCriteria }],
        },
        {
            limit: 100,
        }
    );

    // uhhhhhhhh
    r.sort((a, b) => {
        let aTitles = [a.title, ...a["alt-titles"], ...a["search-titles"]];
        let aBestMatch = Math.max(aTitles.map((e) => similar.compareTwoStrings(search.toLowerCase(), e.toLowerCase())));
        let bTitles = [b.title, ...b["alt-titles"], ...b["search-titles"]];
        let bBestMatch = Math.max(bTitles.map((e) => similar.compareTwoStrings(search.toLowerCase(), e.toLowerCase())));

        return aBestMatch - bBestMatch;
    });

    return res.status(200).json({
        success: true,
        description: `Found ${r.length} result(s).`,
        body: r,
    });
});

// mounts
const songIDRouter = require("./songID/songID.js");

router.use("/:songID", songIDRouter);

module.exports = router;
