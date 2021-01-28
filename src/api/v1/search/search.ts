import * as express from "express";
const router = express.Router({ mergeParams: true });
import db from "../../../db";
import regexSanitise from "escape-string-regexp";
import similar from "string-similarity";
import config from "../../../config/config";
// mounted on /api/v1/search

// NOTE: this is disgustingly inefficient.
// CAN SERIOUSLY BE OPTIMISED - zkldi
router.get("/", async function (req, res) {
    let search = regexSanitise(req.query.title || "");
    let searchCriteria = search;
    if (!req.query.exact) {
        searchCriteria = new RegExp(`${search}`, "i");
    }

    let games = config.supportedGames;

    if (req.query.game && config.supportedGames.includes(req.query.game)) {
        games = [req.query.game];
    }

    let promises = [];

    let joinTitles = (song) => [
        song.title,
        ...(song["alt-titles"] || []),
        ...(song["search-titles"] || []),
    ];

    for (const game of games) {
        promises.push(
            db
                .get(`songs-${game}`)
                .find(
                    {
                        $or: [
                            { title: searchCriteria },
                            { artist: searchCriteria },
                            { genre: searchCriteria },
                            { "alt-titles": searchCriteria },
                            { "search-titles": searchCriteria },
                        ],
                    },
                    {
                        limit: 20,
                    }
                )
                .then((data) => {
                    for (const s of data) {
                        s.game = game;
                        let titles = joinTitles(s);
                        let accs = titles.map(
                            (e) =>
                                similar.compareTwoStrings(
                                    search.toLowerCase(),
                                    `${e}`.toLowerCase()
                                ) || 0
                        );
                        s.accuracy = Math.max(...accs);
                    }
                    return data;
                })
        );
    }

    let results = await Promise.all(promises);

    let r = [];
    for (const result of results) {
        r.push(...result);
    }

    // uhhhhhhhh
    r.sort((a, b) => b.accuracy - a.accuracy);

    return res.status(200).json({
        success: true,
        description: `Found ${r.length} result(s).`,
        body: r,
    });
});

export default router;
