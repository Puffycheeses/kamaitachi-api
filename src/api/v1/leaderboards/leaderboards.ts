import db from "../../../db";
import * as express from "express";
const router = express.Router({ mergeParams: true });
const rgxIsInt = /^[0-9]+$/;
import config from "../../../config/config";
import apiConfig from "../../../apiconfig";
import { FindOptions } from "monk";
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
    let leaderboardData: Partial<Record<Game, Record<string, unknown>>> = {};

    let skip = parseInt(req.query.start) || 0;

    for (const game of config.supportedGames) {
        leaderboardData[game] = {};

        for (const pt of config.validPlaytypes[game]) {
            let leaderboardInfo = (await db.get("users").find(
                {},
                {
                    projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS,
                    sort: { [`ratings.${game}.${pt}`]: -1 },
                    limit: RETURN_LIMIT,
                    skip,
                }
            )) as PublicUserDocument[];

            leaderboardInfo = leaderboardInfo.filter(
                (e) => e.ratings[game] && e.ratings[game][pt] > 0.001
            );
            leaderboardData[game]![pt] = leaderboardInfo;
        }
    }

    return res.status(200).json({
        success: true,
        description: `Found leaderboards for ${config.supportedGames.length} games.`,
        body: leaderboardData,
    });
});

interface LeaderboardSingleGameBody {
    nextStartPoint?: integer;
    items: PublicUserDocument[];
}

/**
 * Returns the leaderboards for the given game.
 * @name GET /v1/leaderboards/games/:game
 * @param playtype - A valid playtype.
 */
router.get("/games/:game", async (req: KTRequest, res) => {
    let game = req.params.game as Game;

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

    let sortCriteria = `ratings.${game}.${playtype}`;

    if (req.query.sortCriteria === "lampRating") {
        sortCriteria = `lampRatings.${game}.${playtype}`;
    }

    if (req.query.customRatings && req.query.sortCriteria) {
        if (!common.IsValidCustomRating(req.query.sortCriteria, game, playtype)) {
            return res.status(400).json({
                success: false,
                description: `Invalid sortCriteria of ${req.query.sortCriteria}`,
            });
        }

        sortCriteria = `customRatings.${game}.${playtype}.${req.query.sortCriteria}`;
    }

    let settings: FindOptions<unknown> = {
        projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS,
        sort: { [sortCriteria]: -1 },
    };

    settings.skip = req.query.start ? parseInt(req.query.start) : 0;
    settings.limit = RETURN_LIMIT;

    if (req.query.limit && !req.query.limit.match(rgxIsInt)) {
        return res.status(400).json({
            success: false,
            description: "Limit is not an integer.",
        });
    }

    if (parseInt(req.query.limit) > settings.limit) {
        return res.status(400).json({
            success: false,
            description: `Limit exceeds ${settings.limit}.`,
        });
    }

    settings.limit = parseInt(req.query.limit);

    let users = await db.get("users").find({}, settings);

    let leaderBody: LeaderboardSingleGameBody = { items: users };

    if (users.length !== 0) {
        leaderBody.nextStartPoint = settings.skip + settings.limit;
    }

    return res.status(200).json({
        success: true,
        description: "Leaderboards successfully returned",
        body: leaderBody,
    });
});

export default router;
