import * as express from "express";
const router = express.Router({ mergeParams: true });
import db from "../../../../../db";
import common from "../../../../../core/common-core";
import config from "../../../../../config/config";

/**
 * @namespace /v1/users/:userID/ranking
 */

/**
 * Returns the ranking of this user on the given game.
 * @name GET /v1/users/:userID/ranking
 */
router.get("/", async (req: KTRequest, res) => {
    let user = req.requestedUser as PublicUserDocument;

    let game = req.query.game;

    if (!common.IsValidGame(game)) {
        return res.status(400).json({
            success: false,
            description: "Invalid or no game provided.",
        });
    }

    let playtype = config.defaultPlaytype[game];

    if (req.query.playtype) {
        if (!common.IsValidPlaytype(playtype, game)) {
            return res.status(400).json({
                success: false,
                description: "Invalid or no playtype provided.",
            });
        }
    }

    if (user.ratings[game] && user.ratings[game][playtype]) {
        let ranking = await db
            .get("users")
            .count({ [`ratings.${game}.${playtype}`]: { $gt: user.ratings[game][playtype] } });

        return res.status(200).json({
            success: true,
            description: "Found users ranking.",
            body: {
                ranking: ranking + 1,
            },
        });
    }

    return res.status(400).json({
        success: false,
        description: "Could not find ranking for user (has user played this game?).",
    });
});

export default router;
