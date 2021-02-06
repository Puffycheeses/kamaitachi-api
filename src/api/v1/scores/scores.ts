import db from "../../../db";
import dbCore from "../../../core/db-core";
import * as express from "express";
import scoreCore from "../../../core/score-core";

const router = express.Router({ mergeParams: true });

/**
 * @namespace v1/scores
 */

const SCORE_LIMIT = 100;
/**
 * Performs an NBQuery on the score database. This also supports saved queries by passing the queryID parameter.
 * @name GET /v1/scores
 * @param queryID - The ID for a saved query stored inside db.queries.
 * @param autoCoerce - if it exists, and is not "false", will automatically join scores
 * such that they return PB data.
 * @param userID - if "self", will limit the returned scores to only those by the requesting user.
 */
router.get("/", async (req: KTRequest, res) => {
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

    if (req.query.userID === "self") {
        if (!req.user) {
            return res.status(400).json({
                success: false,
                description: "Cannot use userID 'self' without being logged in!",
            });
        }

        req.query.userID = req.user.id.toString();
    }

    let resBody = await dbCore.NBQuery<ScoreDocument>(
        "scores",
        req.query,
        true,
        SCORE_LIMIT,
        undefined,
        baseObj
    );

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
});

import scoreIDRouter from "./scoreID/scoreID";

router.use("/:scoreID", scoreIDRouter);

export default router;
