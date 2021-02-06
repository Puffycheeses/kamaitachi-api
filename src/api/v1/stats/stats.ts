import db from "../../../db";
import * as express from "express";
const router = express.Router({ mergeParams: true });
import dbCore from "../../../core/db-core";
import apiConfig from "../../../apiconfig";
import common from "../../../core/common-core";
import JSum from "jsum";

/**
 * @namespace /v1/stats
 */

const STAT_LIMIT = 50;

interface ScoreCountsAggReturn {
    _id: {
        songID: integer;
        scoreData?: {
            difficulty: Difficulties[Game];
            playtype: Playtypes[Game];
        };
        game: Game;
    };
    count: integer;
}

interface GetScoreCountsReturn {
    alltime: ScoreCountsAggReturn[];
    month: ScoreCountsAggReturn[];
    today: ScoreCountsAggReturn[];
}

/**
 * Retrieves values for alltime, this month and the past 24 hours
 * Indicating how much certain songs have been played in that time.
 * @param idObj How to group songs.
 * @param skip Where to start searching from.
 * @param limit When to stop searching.
 * @param queryObj any query to limit the returns of scores.
 */
async function GetScoreCounts(
    idObj: Record<string, unknown>,
    skip: integer,
    limit: integer,
    queryObj = {}
): Promise<GetScoreCountsReturn> {
    let now = new Date();

    // month does it from the start of this month
    let monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // whereas "today" actually, is time this past 24 hours
    // people will appreciate this, maybe.
    let todayStart = now.getTime() - 86400000;

    const mainPipeline = [
        {
            $group: {
                _id: idObj,
                count: { $sum: 1 },
            },
        },
        { $sort: { count: -1 } },
        { $skip: skip },
        { $limit: limit },
    ];

    let allTimeStats = (await db
        .get("scores")
        .aggregate([{ $match: queryObj }, ...mainPipeline])) as ScoreCountsAggReturn[];

    let monthStats = (await db
        .get("scores")
        .aggregate([
            { $match: Object.assign({}, queryObj, { timeAchieved: { $gt: monthStart } }) },
            ...mainPipeline,
        ])) as ScoreCountsAggReturn[];

    let todayStats = (await db
        .get("scores")
        .aggregate([
            { $match: Object.assign({}, queryObj, { timeAchieved: { $gt: todayStart } }) },
            ...mainPipeline,
        ])) as ScoreCountsAggReturn[];

    return {
        alltime: allTimeStats,
        month: monthStats,
        today: todayStats,
    };
}

interface ScoreCountsReturn {
    scoreCounts: GetScoreCountsReturn;
    songData: Partial<Record<Game, SongDocument[]>>;
}

interface ScoreCountCache {
    timestamp: integer;
    data: ScoreCountsReturn;
}

const TWELVE_HOURS = 1000 * 60 * 60 * 12;
const SCORE_COUNT_CACHE: Record<string, ScoreCountCache> = {};

/**
 * Returns the frequency at which songs have been played, as of all-time,
 * this month and past 24 hours.
 * @name GET /v1/stats/most-played
 * @param start
 * @param limit
 * @todo Set up NGINX caching for this, as this is incredibly intensive.
 */
router.get("/most-played", async (req: KTRequest, res) => {
    let queryObj = {};

    let validKeys = apiConfig.validKeys.scores;

    // mutates queryObj to have params we care about safely.
    try {
        dbCore.FancyQueryValidate(req.query, queryObj, validKeys);
    } catch (r) {
        if (r.statusCode && r.body) {
            return res.status(r.statusCode).json(r.body);
        }
        console.error(r);
        return res.status(500).json({
            success: false,
            description: "An internal server error has occured.",
        });
    }

    let skip = common.AssertPositiveInteger(req.query.start, 0);
    let limit = common.AssertPositiveInteger(req.query.limit, STAT_LIMIT, true);

    // we lazily join this with skip and limit instead of mutating queryobj.
    let objHash = `${JSum.digest(queryObj, "sha256", "hex")}|${skip}|${limit}`;

    if (
        SCORE_COUNT_CACHE[objHash] &&
        SCORE_COUNT_CACHE[objHash].timestamp + TWELVE_HOURS > Date.now()
    ) {
        return res.status(200).json({
            success: true,
            description: "Successfully retrieved cached most-played score data.",
            body: SCORE_COUNT_CACHE[objHash].data,
        });
    }

    let groupConcat: Record<string, unknown> = {
        game: "$game",
        songID: "$songID",
    };

    groupConcat.scoreData = {
        difficulty: "$scoreData.difficulty",
        playtype: "$scoreData.playtype",
    };

    let scoreCounts = await GetScoreCounts(groupConcat, skip, limit, queryObj);

    let rBody = {
        scoreCounts,
        songData: {} as Partial<Record<Game, SongDocument[]>>,
    };

    let songData: Partial<Record<Game, SongDocument[]>> = {};
    let gameSongIDs: Partial<Record<Game, integer[]>> = {};
    for (const v of Object.values(scoreCounts)) {
        let arr = v as ScoreCountsAggReturn[]; // shut up
        for (const result of arr) {
            if (!gameSongIDs[result._id.game]) {
                gameSongIDs[result._id.game] = [result._id.songID];
            } else {
                gameSongIDs[result._id.game]!.push(result._id.songID);
            }
        }
    }

    for (const g in gameSongIDs) {
        let game = g as Game;
        songData[game] = await db.get(`songs-${game}`).find({
            id: { $in: gameSongIDs[game] },
        });
    }

    rBody.songData = songData;

    SCORE_COUNT_CACHE[objHash] = {
        timestamp: Date.now(),
        data: rBody,
    };

    return res.status(201).json({
        success: true,
        description: "Successfully retrieved most-played score data.",
        body: rBody,
    });
});

export default router;
