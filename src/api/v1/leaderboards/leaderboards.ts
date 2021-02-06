import db from "../../../db";
import * as express from "express";
const router = express.Router({ mergeParams: true });
import config from "../../../config/config";
import apiConfig from "../../../apiconfig";
import common from "../../../core/common-core";

/**
 * @namespace /v1/leaderboards
 */

const RETURN_LIMIT = 100;

/**
 * Retrieves leaderboard information for kamaitachi.
 * @name GET /v1/leaderboards
 * @param start - A start point for the query.
 */
router.get("/", async (req: KTRequest, res) => {
    let skip = common.AssertPositiveInteger(req.query.start, 0);

    if (!common.IsValidGame(req.query.game)) {
        return res.status(400).json({
            success: false,
            description: `Invalid value for game of ${req.query.game}`,
        });
    }

    let game = req.query.game;
    let playtype = config.defaultPlaytype[game];

    if (req.query.playtype) {
        if (!common.IsValidPlaytype(req.query.playtype, game)) {
            return res.status(400).json({
                success: false,
                description: `Invalid playtype of ${req.query.playtype}`,
            });
        }

        playtype = req.query.playtype;
    }

    let leaderboardInfo = (await db.get("users").find(
        {
            [`ratings.${game}.${playtype}`]: { $gt: 0 },
        },
        {
            projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS,
            sort: { [`ratings.${game}.${playtype}`]: -1 },
            limit: RETURN_LIMIT,
            skip,
        }
    )) as PublicUserDocument[];

    return res.status(200).json({
        success: true,
        description: `Found leaderboards for ${game} [${playtype}].`,
        body: leaderboardInfo,
    });
});

export default router;
