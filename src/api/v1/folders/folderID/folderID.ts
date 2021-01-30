import * as express from "express";
const router = express.Router({ mergeParams: true });
import db from "../../../../db";
import config from "../../../../config/config";
import scoreCore from "../../../../core/score-core";
import folderCore from "../../../../core/folder-core";
import userCore from "../../../../core/user-core";
import common from "../../../../core/common-core";

// mounted on /api/v1/folders/:folderID

async function RequireValidFolderID(
    req: KTRequest,
    res: express.Response,
    next: express.NextFunction
) {
    let folder = await db.get("folders").findOne({
        folderID: req.params.folderID,
    });

    if (!folder) {
        return res.status(404).json({
            success: false,
            description: "This folder does not exist.",
        });
    }

    req.folderData = folder;

    db.get("folders").update(
        {
            _id: folder._id,
        },
        {
            $inc: { views: 1 },
        }
    );

    next();
}

router.use(RequireValidFolderID);

/**
 * Returns the folder with the ID as a parameter.
 * @name GET v1/folders/:folderID
 */
router.get("/", async (req, res) =>
    res.status(200).json({
        success: true,
        description: `Successfully found ${req.folderData!.title}.`,
        body: req.folderData,
    })
);

async function ValidateUserID(req: KTRequest, res: express.Response, next: express.NextFunction) {
    if (req.query.userID) {
        let u = await userCore.GetUser(req.query.userID);

        if (u) {
            req.requestedUser = u;
        } else {
            return res.status(404).json({
                success: false,
                description: `No user with the id ${req.query.userID} could be found.`,
            });
        }
    } else {
        if (!req.apikey) {
            return res.status(400).json({
                success: false,
                description: "No user given, and no credentials to default to.",
            });
        }
        req.requestedUser = req.user;
    }

    next();
}

async function ValidateRivalGroupID(
    req: KTRequest,
    res: express.Response,
    next: express.NextFunction
) {
    if (req.query.rivalGroupID) {
        let rg = await db.get("rivals").findOne({ rivalGroupID: req.query.rivalGroupID });

        if (rg) {
            req.rivalGroup = rg;
        } else {
            return res.status(404).json({
                success: false,
                description: `No rivalgroup with the id ${req.query.rivalGroupID} could be found.`,
            });
        }
    }

    next();
}

/**
 * Returns the charts that belong to the given folderID.
 * @name GET v1/folders/:folderID/charts
 * @param playtype - The playtype to filter charts by.
 * @param difficulty - The difficulty to filter charts by.
 */
router.get("/charts", async (req: KTRequest, res) => {
    let folder = req.folderData as FolderDocument;

    let playtype = null;
    let difficulty = null;

    if (req.query.playtype) {
        if (!common.IsValidPlaytype(req.query.playtype, folder.game)) {
            return res.status(400).json({
                success: false,
                description: `Playtype ${req.query.playtype} provided, but this was not valid for ${folder.game}.`,
            });
        }

        playtype = req.query.playtype;
    }

    if (req.query.difficulty) {
        if (!common.IsValidDifficulty(req.query.difficulty, folder.game)) {
            return res.status(400).json({
                success: false,
                description: `Difficulty ${req.query.difficulty} provided, but this was not valid for ${folder.game}.`,
            });
        }

        difficulty = req.query.difficulty;
    }

    let { songs, charts } = await folderCore.GetDataFromFolderQuery(folder, playtype, difficulty);

    return res.status(200).json({
        success: true,
        description: "Successfully retrieved songs and charts.",
        body: {
            songs,
            charts,
        },
    });
});

/**
 * Gets a given user's scores on the folder.
 * @name GET v1/folders/:folderID/scores
 * @param playtype - Limits returned scores to only those for the given playtype.
 * @param difficulty - Limits returned scores to only those for the given difficulty.
 * @param getServerRecords - (unimplemented) returns the server records for all charts in the folder.
 * @param beforeTimestamp - If present, returns only score PBs that occured before its value as a timestamp.
 */
router.get("/scores", ValidateUserID, ValidateRivalGroupID, async (req, res) => {
    let folder = req.folderData as FolderDocument;
    let requestedUserID = req.requestedUser!.id;

    let playtype = null;
    let difficulty = null;

    if (req.query.playtype) {
        if (!common.IsValidPlaytype(req.query.playtype, folder.game)) {
            return res.status(400).json({
                success: false,
                description: `Playtype ${req.query.playtype} provided, but this was not valid for ${folder.game}.`,
            });
        }

        playtype = req.query.playtype;
    }

    if (req.query.difficulty) {
        if (!common.IsValidDifficulty(req.query.difficulty, folder.game)) {
            return res.status(400).json({
                success: false,
                description: `Difficulty ${req.query.difficulty} provided, but this was not valid for ${folder.game}.`,
            });
        }

        difficulty = req.query.difficulty;
    }

    let { songs, charts } = await folderCore.GetDataFromFolderQuery(folder, playtype, difficulty);

    let scores: ScoreDocument[] = [];

    if (req.rivalGroup) {
        let aggScores: { score: ScoreDocument }[] = await db.get("scores").aggregate([
            {
                $match: {
                    chartID: { $in: charts.map((e) => e.chartID) },
                    userID: { $in: req.rivalGroup.members },
                    isScorePB: true,
                },
            },
            {
                $sort: { "scoreData.percent": -1 },
            },
            {
                $group: {
                    _id: "$chartID",
                    score: { $first: "$$ROOT" },
                },
            },
        ]);

        scores = aggScores.map((e) => e.score);
    } else if (req.query.getServerRecords) {
        // unimplemented, sorry.
    } else if (req.query.beforeTimestamp) {
        // because we're not using isScorePB/isLampPB anymore, we need to do some INTERESTING aggregate pipelining

        let scPipe = await db.get("scores").aggregate([
            {
                // step 1: Filter all the scores to only those we care about
                $match: {
                    timeAchieved: { $lte: parseInt(req.query.beforeTimestamp) },
                    userID: requestedUserID,
                    chartID: { $in: charts.map((e) => e.chartID) },
                },
            },
            {
                // step 2: MongoDB doesn't support returning the document that is the largest value on a certain column,
                // so we sort the ENTIRE above db by scoreData.score, then use group, and select the first value in the DB.
                // this is a disgusting hack, in my opinion, but there is genuinely no better way with mongo.
                $sort: { "scoreData.score": -1 },
            },
            {
                // step 3: group on chartID, then pull the first value that matches.
                // since the above step sorts all scores by their score value, we're guaranteed to get a score PB here.
                // we then also grab the best lampIndex for the score, and we use this to overwrite the lamp status in
                // scorePB.
                $group: {
                    _id: "$chartID",
                    scorePB: { $first: "$$ROOT" }, // this is the only way to get the whole document that matches this expression, seriously.
                    lampPB: { $max: "$scoreData.lampIndex" },
                },
            },
        ]);

        for (const scoreData of scPipe) {
            let scDoc: ScoreDocument = scoreData.scorePB;
            if (!scDoc) {
                continue;
            }
            scDoc.scoreData.lampIndex = scoreData.lampPB;
            scDoc.scoreData.lamp = config.lamps[scDoc.game][scoreData.lampPB];
            scores.push(scDoc);
        }
    } else {
        let scoreQueryObj = {
            chartID: { $in: charts.map((e) => e.chartID) },
            userID: requestedUserID,
            isScorePB: true,
        };

        let scorePBs = await db.get("scores").find(scoreQueryObj);

        scores = await scoreCore.AutoCoerce(scorePBs);
    }

    let users = await userCore.GetUsers(scores.map((e) => e.userID));

    return res.status(200).json({
        success: true,
        description: `Successfully found ${scores.length} scores in folder ${folder.title}`,
        body: {
            scores,
            songs,
            charts,
            users,
        },
    });
});

/**
 * Returns a users goals on the given folder.
 * @name GET v1/folders/:folderID/goals
 */
router.get("/goals", ValidateUserID, async (req, res) => {
    let folder = req.folderData as FolderDocument;
    let requestedUserID = req.requestedUser!.id;

    let { charts } = await folderCore.GetDataFromFolderQuery(folder, null, null, true);

    let chartIDs = charts.map((e) => e.chartID);

    let queryObj = {
        $or: [{ directChartID: { $in: chartIDs } }, { directChartIDs: { $in: chartIDs } }],
    };

    let goals = await db.get("goals").find(queryObj);
    let userGoals = await db.get("user-goals").find({
        goalID: { $in: goals.map((e) => e.goalID) },
        userID: requestedUserID,
    });

    return res.status(200).json({
        success: true,
        description: `Successfully found ${userGoals.length} user goals.`,
        body: {
            goals,
            userGoals,
        },
    });
});

/**
 * Returns tierlist data for the given folder.
 * @name GET v1/folders/:folderID/tierlist-data
 */
router.get("/tierlist-data", async (req: KTRequest, res) => {
    let folder = req.folderData as FolderDocument;
    let playtype = req.query.playtype || config.defaultPlaytype[folder.game];

    if (!common.IsValidPlaytype(playtype, folder.game)) {
        return res.status(400).json({
            success: false,
            description: "No playtype provided, or the one given was invalid.",
        });
    }

    let charts = (await folderCore.GetDataFromFolderQuery(folder, playtype, null, true)).charts;

    let tierlist = await db.get("tierlist").findOne({
        game: folder.game,
        playtype: playtype,
        isDefault: true,
    });

    let tierlistData = await db.get("tierlistdata").find({
        chartID: { $in: charts.map((e) => e.chartID) },
        tierlistID: tierlist.tierlistID,
    });

    return res.status(200).json({
        success: true,
        description: "Successfully found tierlist information.",
        body: {
            tierlist,
            tierlistData,
        },
    });
});

const TARGET_NAMES = {
    score: "Score",
    percent: "Percent",
    lamp: "Lamp",
    grade: "Grade",
};

/**
 * Validates targetVal and targetName to work with timeline related functions.
 */
function ValidateTimelineValues(req: KTRequest, res: express.Response, next: express.NextFunction) {
    let game = req.folderData!.game;
    let targetName = "lamp";
    let clearLamp = config.clearLamp[game];
    let targetVal = config.lamps[game].indexOf(clearLamp);

    if (req.query.targetName) {
        if (!Object.prototype.hasOwnProperty.call(TARGET_NAMES, req.query.targetName)) {
            return res.status(400).json({
                success: false,
                description: `Invalid targetName ${req.query.targetName}`,
            });
        }

        targetName = req.query.targetName;
    }

    if (req.query.targetVal) {
        let tVal = parseFloat(req.query.targetVal);

        if (tVal < 0 || isNaN(tVal) || !isFinite(tVal)) {
            return res.status(400).json({
                success: false,
                description: "Invalid value for targetValue",
            });
        }

        if (targetName === "lamp" || targetName === "grade") {
            let elementActuallyExists =
                targetName === "lamp" ? config.lamps[game][tVal] : config.grades[game][tVal];

            if (elementActuallyExists) {
                targetVal = tVal;
            }
        } else {
            targetVal = tVal;
        }
    }

    req.query.targetVal = targetVal.toString();
    req.query.targetName = targetName;

    return next();
}

const INTERNAL_TARGET_NAME = {
    lamp: "scoreData.lampIndex",
    grade: "scoreData.gradeIndex",
    percent: "scoreData.percent",
    score: "scoreData.score",
};

/**
 * Gets the data necessary to render a Kamaitachi WebUI timeline.
 * @name GET v1/folders/:folderID/timeline
 * @param targetName - lamp, grade, percent or score depending on what the timeline pivots on.
 * @param targetVal - a number representing the target in question.
 */
router.get("/timeline", ValidateTimelineValues, ValidateUserID, async (req, res) => {
    let targetVal = parseFloat(req.query.targetVal);
    let targetName = req.query.targetName as "lamp" | "grade" | "percent" | "score";
    let requestedUserID = req.requestedUser!.id;

    let folder = req.folderData as FolderDocument;
    let playtype = req.query.playtype || config.defaultPlaytype[folder.game];

    if (!common.IsValidPlaytype(playtype, folder.game)) {
        return res.status(400).json({
            success: false,
            description: "Playtype provided, but the one given was invalid.",
        });
    }

    let difficulty = req.query.difficulty || null;

    if (req.query.difficulty && !common.IsValidDifficulty(req.query.difficulty, folder.game)) {
        return res.status(400).json({
            success: false,
            description: "Difficulty provided, but the one given was invalid.",
        });
    }

    let { songs, charts } = await folderCore.GetDataFromFolderQuery(
        folder,
        playtype,
        difficulty as Difficulties[Game] | null
    );

    let scoreData: { sc: ScoreDocument }[] = await db.get("scores").aggregate([
        {
            $match: {
                userID: requestedUserID,
                chartID: { $in: charts.map((e) => e.chartID) },
                [INTERNAL_TARGET_NAME[targetName]]: { $gte: targetVal },
                timeAchieved: { $ne: null }, // vomit
            },
        },
        {
            $sort: {
                timeAchieved: 1,
            },
        },
        {
            $group: {
                _id: "$chartID",
                sc: { $first: "$$ROOT" },
            },
        },
    ]);

    let scores = scoreData.map((e) => e.sc);

    return res.status(200).json({
        success: true,
        description: `Successfully returned timeline data for ${folder.title}.`,
        body: {
            songs,
            charts,
            scores,
        },
    });
});

export default router;
