import * as express from "express";
const router = express.Router({ mergeParams: true });
import dbCore from "../../../../../core/db-core";
import db from "../../../../../db";

// mounted on /api/v1/users/:userID/scores

router.get("/count", async (req, res) => {
    let user = req.requestedUser;

    req.query.userID = `${user.id}`;

    if (req.query.playtype) {
        req.query["scoreData.playtype"] = req.query.playtype;
    }

    try {
        let dbRes = await dbCore.FancyDBQuery("scores", req.query, false, null, null, true);

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

interface PartialTimestampScore {
    timeAchieved: number;
}

router.get("/heatmap", async (req, res) => {
    let user = req.requestedUser;

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
        queryObj.game = req.query.game;
    }

    if (req.query.playtype) {
        queryObj["scoreData.playtype"] = req.query.playtype;
    }

    let timeData: Array<PartialTimestampScore> = await db.get("scores").find(queryObj, {
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
