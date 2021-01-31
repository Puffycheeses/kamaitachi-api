import * as express from "express";
const router = express.Router({ mergeParams: true });
import dbCore from "../../../../../core/db-core";
import db from "../../../../../db";
import common from "../../../../../core/common-core";

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

    let dbRes = await dbCore.FancyDBQuery("scores", req.query, false, undefined, undefined, true);

    return res.status(dbRes.statusCode).json(dbRes.body);
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
    }

    if (req.query.playtype) {
        if (!req.query.game) {
            return res.status(400).json({
                success: false,
                description: "Cannot specify playtype without specifying game.",
            });
        }

        queryObj["scoreData.playtype"] = req.query.playtype;
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
