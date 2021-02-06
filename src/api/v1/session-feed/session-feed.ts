import * as express from "express";
import dbCore from "../../../core/db-core";
const router = express.Router({ mergeParams: true });
import db from "../../../db";
import sessionCore from "../../../core/session-core";

/**
 * @namespace /v1/session-feed
 */

interface SessionFeedReturns extends FancyQueryBody<SessionDocument> {
    highlightedScores?: Record<string, ScoreDocument[]>;
    users?: PublicUserDocument[];
    charts?: Record<Game, ChartDocument[]>;
    songs?: Record<Game, SongDocument[]>;
}

/**
 * Returns data optimised for displaying a session feed.
 * @name GET /v1/session-feed
 * @note This is incredibly optimised, and as a result is unintuitive code.
 */
const MAX_RETURNS = 50;
router.get("/", async (req: KTRequest, res) => {
    let queryObj = {};
    try {
        queryObj = await sessionCore.HandleCustomUserSelections(req, queryObj);
    } catch (e) {
        if (e.statusCode && e.body) {
            return res.status(e.statusCode).json(e.body);
        } else {
            console.error(`===== FATAL IN /SESSION-FEED HandleCustomUserSelections ======`);
            console.error(e);
            console.error(`${req.originalUrl}`);
            console.error(`===== END ERROR LOG =====`);
        }
    }

    let dbRes = await dbCore.NBQuery<SessionDocument>(
        "sessions",
        req.query,
        true,
        MAX_RETURNS,
        undefined,
        queryObj
    );

    if (dbRes.body.success) {
        let users = new Set();
        let chartIDs: Partial<Record<Game, Set<string>>> = {};
        let songIDs: Partial<Record<Game, Set<number>>> = {};
        // sessionID to highlightedScoresMap

        let sessionFeedReturns: SessionFeedReturns = dbRes.body.body;

        sessionFeedReturns.highlightedScores = {};
        let promiseArr = [];

        for (const session of sessionFeedReturns.items) {
            users.add(session.userID);

            // @ts-expect-error Monkeypatching scoreCount onto session document.
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
                            comment: 1,
                        },
                    }
                )
                // I have absolutely no idea how this eslint rule works but it clearly doesn't
                // work well for typescript
                // eslint-disable-next-line no-loop-func
                .then((rx) => {
                    if (!rx.length) {
                        return;
                    }

                    let r: ScoreDocument[] = rx;

                    sessionFeedReturns.highlightedScores![session.sessionID] = r;

                    if (!chartIDs[session.game]) {
                        chartIDs[session.game] = new Set();
                    }

                    if (!songIDs[session.game]) {
                        songIDs[session.game] = new Set();
                    }

                    for (const sc of r) {
                        chartIDs[session.game]!.add(sc.chartID);
                        songIDs[session.game]!.add(sc.songID);
                    }
                });

            promiseArr.push(p);

            // @ts-expect-error I know that these parameters should be optional
            // but we're doing wacky things here anyway
            // dont worry about it.
            delete session.scores; // remove useless data from response.
        }

        await Promise.all(promiseArr);

        let allSongs: Partial<Record<Game, SongDocument[]>> = {};
        let allCharts: Partial<Record<Game, ChartDocument[]>> = {};

        // despite the fact that this is a record with key Game
        // ts is INSISTENT that g should be a string.
        // it's not, and it shouldnt be, and TS should shut the hell up.
        for (const g in chartIDs) {
            let game: Game = g as Game;

            let songs = await db.get(`songs-${game}`).find({
                id: { $in: [...songIDs[game]!] },
            });

            let charts = await db.get(`charts-${game}`).find({
                chartID: { $in: [...chartIDs[game]!] },
            });

            allSongs[game] = songs;
            allCharts[game] = charts;
        }

        sessionFeedReturns.charts = allCharts as Record<Game, ChartDocument[]>;
        sessionFeedReturns.songs = allSongs as Record<Game, SongDocument[]>;

        let dbUsers = await db.get("users").find(
            {
                id: { $in: [...users] },
            },
            {
                projection: {
                    displayname: 1,
                    username: 1,
                    id: 1,
                    custompfp: 1,
                    classes: 1,
                    clan: 1,
                    ratings: 1,
                },
            }
        );

        sessionFeedReturns.users = dbUsers;

        // assign back
        dbRes.body.body = sessionFeedReturns;
    }

    return res.status(dbRes.statusCode).json(dbRes.body);
});

export default router;
