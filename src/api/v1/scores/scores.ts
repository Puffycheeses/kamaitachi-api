import db from "../../../db";
import dbCore from "../../../core/db-core";
import * as express from "express";
import scoreCore from "../../../core/score-core";
import config from "../../../config/config";
import middlewares from "../../../middlewares";
import regexSanitise from "escape-string-regexp";

const router = express.Router({ mergeParams: true });

/**
 * @namespace v1/scores
 */

/**
 * Returns a count of all of Kamaitachi's currently loaded scores.
 * @name GET /v1/scores
 */
router.get("/", async function (req, res) {
    let scoreCount = await db.get("scores").count({});
    let gameCount: Record<string, number> = {};
    for (const game of config.supportedGames) {
        gameCount[game] = await db.get("scores").count({ game: game });
    }
    return res.status(200).json({
        success: true,
        description: `Kamaitachi is live and powering ${scoreCount} scores.`,
        body: {
            scoreCount: scoreCount,
            gameCount: gameCount,
        },
    });
});

/**
 * Retrieves a users' best 100 scores sorted on calculatedData.rating.
 * @name GET /v1/scores/:userID/best
 */
router.get("/:userID/best", middlewares.RequireExistingUser, async function (req: KTRequest, res) {
    // overassert typescript so we can use this parameter as a member of Game.
    // note that we check below whether this is even the case.
    let game: Game = req.query.game as Game;

    if (!config.supportedGames.includes(game)) {
        return res.status(400).json({
            success: false,
            description: "This game is not supported, or one was not provided.",
        });
    }

    if (!config.validPlaytypes[game].includes(req.query.playtype)) {
        return res.status(400).json({
            success: false,
            description: "This playtype is not supported, or one was not provided.",
        });
    }

    let startPoint = 0;

    if (Number.isInteger(parseInt(req.query.start))) {
        startPoint = parseInt(req.query.start);
    }

    // else if we get here we're all good

    let bestScores = (await db.get("scores").find(
        {
            userID: parseInt(req.params.userID),
            game: req.query.game,
            "scoreData.playtype": req.query.playtype,
            isScorePB: true,
        },
        {
            sort: { "calculatedData.rating": -1 },
            limit: 100,
            skip: startPoint,
        }
    )) as ScoreDocument[];

    if (req.query.autocoerce !== "false") {
        bestScores = await scoreCore.AutoCoerce(bestScores);
    }

    if (bestScores.length === 0) {
        return res.status(200).json({
            success: true,
            description: "This user has no scores.",
            body: {
                scores: [],
                songs: [],
                charts: [],
            },
        });
    }

    let songs = await db
        .get(`songs-${req.query.game}`)
        .find({ id: { $in: bestScores.map((e) => e.songID) } });

    let charts = await db.get(`charts-${req.query.game}`).find({
        $or: bestScores.map((e) => ({
            id: e.songID,
            difficulty: e.scoreData.difficulty,
            playtype: e.scoreData.playtype,
        })),
    });

    return res.status(200).json({
        success: true,
        description: `Found ${bestScores.length} scores.`,
        body: {
            scores: bestScores,
            songs: songs,
            charts: charts,
        },
    });
});

const SCORE_LIMIT = 100;
/**
 * Performs a query on the score database. This also supports saved queries by passing the queryID parameter.
 * @name GET /v1/scores/query
 * @param queryID - The ID for a saved query stored inside db.queries.
 * @param titleSearch - Limits the results of a query to songs that match /like/ the title.
 * @param autoCoerce - if it exists, and is not "false", will automatically join scores
 * such that they return PB data.
 * @param userID - if "self", will limit the returned scores to only those by the requesting user.
 */
router.get("/query", async function (req: KTRequest, res) {
    let baseObj: Record<string, unknown> = {};

    if (req.query.queryID) {
        let queryObj = await db.get("queries").findOne({
            queryID: req.query.queryID,
        });

        if (!queryObj) {
            return res.status(400).json({
                success: false,
                description: "This query does not exist in the database.",
            });
        }

        // else, hell dimension monkey patch

        for (const key in queryObj.query) {
            let realKey = key.replace(/¬/g, ".");
            req.query[realKey] = queryObj.query[key];
        }
    }

    if (req.query.autoCoerce !== "false") {
        baseObj.isScorePB = true;
    }

    if (!req.query.allowInvalid || req.query.allowInvalid !== "true") {
        baseObj.validity = { $ne: "invalid" };
    }

    if (req.query.titleSearch) {
        let regex = new RegExp(regexSanitise(req.query.titleSearch), "i");

        let likeQuery = {
            $or: [{ title: regex }, { "alt-titles": regex }],
        };

        if (req.query.game) {
            let similarSongs = await db.get(`songs-${req.query.game}`).find(likeQuery);
            baseObj.songID = {
                $in: similarSongs.map((e) => e.id),
            };
        } else {
            baseObj.$or = [];
            for (const game of config.supportedGames) {
                let similarSongs = await db.get(`songs-${game}`).find(likeQuery);

                (baseObj.$or as Array<unknown>).push({
                    songID: { $in: similarSongs.map((e) => e.id) },
                    game: game,
                });
            }
        }
    }

    if (req.query.userID === "self" && req.user) {
        req.query.userID = req.user.id.toString();
    }

    try {
        let resBody = (await dbCore.FancyDBQuery<ScoreDocument>(
            "scores",
            req.query,
            true,
            SCORE_LIMIT,
            undefined,
            false,
            baseObj
        )) as FancyQueryPseudoResponse<ScoreDocument>;

        // there are some other options we can use if this operation is successful
        if (resBody.body.success) {
            if (req.query.autoCoerce !== "false") {
                resBody.body.body.items = await scoreCore.AutoCoerce(
                    resBody.body.body.items as ScoreDocument[]
                );
            }
            if (req.query.getAssocData && req.query.getAssocData === "true") {
                resBody.body.body = await scoreCore.GetAssocData(resBody.body.body);
            }

            // if this was an existing query, increment popularity
            // yeah, you can trivially break this. but you shouldn't!

            if (req.query.queryID) {
                // can error for all we care
                db.get("queries").update(
                    {
                        queryID: req.query.queryID,
                    },
                    { $inc: { timesUsed: 1 } }
                );
            }
        }

        return res.status(resBody.statusCode).json(resBody.body);
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

import scoreIDRouter from "./scoreID/scoreID";

router.use("/:scoreID", scoreIDRouter);

export default router;
