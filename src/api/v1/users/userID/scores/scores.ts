import * as express from "express";
const router = express.Router({ mergeParams: true });
import dbCore from "../../../../../core/db-core";
import db from "../../../../../db";
import common from "../../../../../core/common-core";
import scoreCore from "../../../../../core/score-core";

/**
 * @namespace /v1/users/:userID/scores
 */

/**
 * Counts the users scores that satisfy the fancyquery.
 * @name GET /v1/users/:userID/scores/count
 */
router.get("/count", async (req: KTRequest, res) => {
    let user = req.requestedUser as PublicUserDocument;

    req.query.userID = user.id.toString();

    let dbRes = await dbCore.NBCount("scores", req.query, false, undefined, undefined);

    return res.status(dbRes.statusCode).json(dbRes.body);
});

/**
 * Retrieves a users' best 100 scores sorted on calculatedData.rating.
 * @name GET /v1/users/:userID/scores/best
 * @param game
 * @param playtype
 */
router.get("/best", async (req: KTRequest, res) => {
    let game = req.query.game;

    if (!common.IsValidGame(game)) {
        return res.status(400).json({
            success: false,
            description: "This game is not supported, or one was not provided.",
        });
    }

    if (!common.IsValidPlaytype(req.query.playtype, game)) {
        return res.status(400).json({
            success: false,
            description: "This playtype is not supported, or one was not provided.",
        });
    }

    let startPoint = common.AssertPositiveInteger(req.query.start, 0);

    let limit = common.AssertPositiveIntegerNonZero(req.query.limit, 100, true);

    // else if we get here we're all good

    let bestScores = (await db.get("scores").find(
        {
            userID: parseInt(req.params.userID),
            game: game,
            "scoreData.playtype": req.query.playtype,
            isScorePB: true,
        },
        {
            sort: { "calculatedData.rating": -1 },
            limit: limit,
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
        .get(`songs-${game}`)
        .find({ id: { $in: bestScores.map((e) => e.songID) } });

    let charts = await db.get(`charts-${game}`).find({
        chartID: { $in: bestScores.map((e) => e.chartID) },
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

interface PartialTimestampScore {
    timeAchieved: number;
}

/**
 * Returns the data necessary to fill out profile github squares.
 * @name GET /v1/users/:userID/scores/heatmap
 * @param game - Limits results to only one game.
 * @param playtype - Limits results to only those that satisfy that playtype.
 */
router.get("/heatmap", async (req: KTRequest, res) => {
    let user = req.requestedUser as PublicUserDocument;

    // actually, its just 365 days, but you know how it is.
    const ONE_YEAR = 31536000000; // 1000 * 60 * 60 * 24 * 365

    // todo, let people pass custom values to this
    let endPoint = Date.now();
    let startPoint = endPoint - ONE_YEAR;

    let queryObj: Record<string, unknown> = {
        userID: user.id,
        timeAchieved: { $gt: startPoint },
    };

    if (req.query.game) {
        if (!common.IsValidGame(req.query.game)) {
            return res.status(400).json({
                success: false,
                description: `Invalid playtype ${req.query.game}`,
            });
        }

        queryObj.game = req.query.game;

        if (req.query.playtype) {
            if (!common.IsValidPlaytype(req.query.playtype, req.query.game)) {
                return res.status(400).json({
                    success: false,
                    description: `Invalid playtype ${req.query.playtype}.`,
                });
            }

            queryObj["scoreData.playtype"] = req.query.playtype;
        }
    }

    let timeData: PartialTimestampScore[] = await db.get("scores").find(queryObj, {
        projection: { timeAchieved: 1 },
    });

    return res.status(200).json({
        success: true,
        description: `Successfully got heatmap data for ${req.params.userID}`,
        body: {
            data: timeData.map((e) => e.timeAchieved),
        },
    });
});

export default router;
