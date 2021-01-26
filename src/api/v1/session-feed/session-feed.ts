import * as express from "express";
const dbCore = require("../../../core/db-core.js");
const router = express.Router({ mergeParams: true });
const db = require("../../../db.js");
const apiConfig = require("../../../apiconfig.js");
const sessionCore = require("../../../core/session-core.js");

// Returns data optimised for displaying the session feed.
// (saves having to make multiple requests.)
// note that, if this looks strange, it's because it is making optimisations **everywhere**.
const MAX_RETURNS = 50;
router.get("/", async function (req, res) {
    try {
        let queryObj = {};
        queryObj = await sessionCore.HandleCustomUserSelections(req, queryObj);

        let dbRes = await dbCore.FancyDBQuery("sessions", req.query, true, MAX_RETURNS, null, false, queryObj);

        if (dbRes.body.success) {
            let users = new Set();
            let chartIDs = new Set();
            let songIDs = new Set();
            // sessionID to highlightedScoresMap

            dbRes.body.body.highlightedScores = {};
            let promiseArr = [];

            for (const session of dbRes.body.body.items) {
                users.add(session.userID);

                // monkey patch
                session.scoreCount = session.scores.length;

                let scoreIDs = session.scores.map((e) => e.scoreID);

                let p = db
                    .get("scores")
                    .find(
                        {
                            scoreID: { $in: scoreIDs },
                            highlight: true,
                        },
                        {
                            projection: {
                                songID: 1,
                                scoreID: 1,
                                chartID: 1,
                                "scoreData.grade": 1,
                                "scoreData.gradeIndex": 1,
                                "scoreData.percent": 1,
                                "scoreData.score": 1,
                                "scoreData.lamp": 1,
                                "scoreData.lampIndex": 1,
                            },
                        }
                    )
                    .then((r) => {
                        if (!r.length) {
                            return;
                        }

                        dbRes.body.body.highlightedScores[session.sessionID] = r;

                        if (!chartIDs[session.game]) {
                            chartIDs[session.game] = new Set();
                        }
                        if (!songIDs[session.game]) {
                            songIDs[session.game] = new Set();
                        }

                        for (const sc of r) {
                            chartIDs[session.game].add(sc.chartID);
                            songIDs[session.game].add(sc.songID);
                        }
                    });

                promiseArr.push(p);

                delete session.scores; // remove useless data from response.
            }

            await Promise.all(promiseArr);

            let allSongs = {};
            let allCharts = {};

            for (const game in chartIDs) {
                let songs = await db.get(`songs-${game}`).find({
                    id: { $in: [...songIDs[game]] },
                });

                let charts = await db.get(`charts-${game}`).find({
                    chartID: { $in: [...chartIDs[game]] },
                });

                allSongs[game] = songs;
                allCharts[game] = charts;
            }

            dbRes.body.body.charts = allCharts;
            dbRes.body.body.songs = allSongs;

            let dbUsers = await db.get("users").find(
                {
                    id: { $in: [...users] },
                },
                {
                    projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS,
                }
            );

            dbRes.body.body.users = dbUsers;
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

module.exports = router;
