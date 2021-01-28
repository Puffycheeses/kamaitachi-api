import * as express from "express";
import dbCore from "../../../../core/db-core";
const router = express.Router({ mergeParams: true });
import db from "../../../../db";
import config from "../../../../config/config";
import scoreCore from "../../../../core/score-core";
import folderCore from "../../../../core/folder-core";

// mounted on /api/v1/folders/:folderID

async function RequireValidFolderID(req, res, next) {
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

router.get("/", async function (req, res) {
    return res.status(200).json({
        success: true,
        description: `Successfully found ${req.folderData.title}.`,
        body: req.folderData,
    });
});

async function ValidateUserID(req, res, next) {
    if (Number.isInteger(parseInt(req.query.userID))) {
        let u = await db
            .get("users")
            .findOne(
                { id: parseInt(req.query.userID) },
                { projection: { password: 0, email: 0, integrations: 0 } }
            );

        if (u) {
            req.requestedUserID = u.id;
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
        req.requestedUserID = req.apikey.assignedTo;
    }

    next();
}

async function ValidateRivalGroupID(req, res, next) {
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

router.get("/charts", async function (req, res) {
    let folder = req.folderData;

    let playtype = null;
    let difficulty = null;

    if (req.query.playtype) {
        if (config.validPlaytypes[folder.game].includes(req.query.playtype)) {
            playtype = req.query.playtype;
        } else {
            return res.status(400).json({
                success: false,
                description: `Playtype ${req.query.playtype} provided, but this was not valid for ${folder.game}.`,
            });
        }
    }

    if (req.query.difficulty) {
        if (config.validDifficulties[folder.game].includes(req.query.difficulty)) {
            difficulty = req.query.difficulty;
        } else {
            return res.status(400).json({
                success: false,
                description: `Difficulty ${req.query.difficulty} provided, but this was not valid for ${folder.game}.`,
            });
        }
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

router.get("/scores", ValidateUserID, ValidateRivalGroupID, async function (req, res) {
    let folder = req.folderData;
    let requestedUserID = req.requestedUserID;

    let playtype = null;
    let difficulty = null;

    if (req.query.playtype) {
        if (config.validPlaytypes[folder.game].includes(req.query.playtype)) {
            playtype = req.query.playtype;
        } else {
            return res.status(400).json({
                success: false,
                description: `Playtype ${req.query.playtype} provided, but this was not valid for ${folder.game}.`,
            });
        }
    }

    if (req.query.difficulty) {
        if (config.validDifficulties[folder.game].includes(req.query.difficulty)) {
            difficulty = req.query.difficulty;
        } else {
            return res.status(400).json({
                success: false,
                description: `Difficulty ${req.query.difficulty} provided, but this was not valid for ${folder.game}.`,
            });
        }
    }

    let { songs, charts } = await folderCore.GetDataFromFolderQuery(folder, playtype, difficulty);

    let scores = [];

    if (req.rivalGroup) {
        let aggScores = await db.get("scores").aggregate([
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
            let scDoc = scoreData.scorePB;
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

    let users = await db.get("users").find(
        {
            id: { $in: scores.map((e) => e.userID) },
        },
        {
            projection: {
                _id: 0,
                password: 0,
                email: 0,
                integrations: 0,
            },
        }
    );

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

router.get("/goals", ValidateUserID, async function (req, res) {
    let folder = req.folderData;

    let { charts } = await folderCore.GetDataFromFolderQuery(folder, null, null, true);

    let chartIDs = charts.map((e) => e.chartID);

    let queryObj = {
        $or: [{ directChartID: { $in: chartIDs } }, { directChartIDs: { $in: chartIDs } }],
    };

    let goals = await db.get("goals").find(queryObj);
    let userGoals = await db.get("user-goals").find({
        goalID: { $in: goals.map((e) => e.goalID) },
        userID: req.requestedUserID,
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

router.get("/tierlist-data", async function (req, res) {
    let folder = req.folderData;
    let playtype = req.query.playtype || config.defaultPlaytype[folder.game];

    if (!config.validPlaytypes[folder.game].includes(playtype)) {
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

function ValidateTimelineValues(req, res, next) {
    let game = req.folderData.game;
    let targetName = "lamp";
    let clearLamp = config.clearLamp[game];
    let targetVal = config.lamps[game].indexOf(clearLamp);

    if (req.query.targetName) {
        let passedTNameData = TARGET_NAMES[req.query.targetName];
        if (passedTNameData) {
            targetName = req.query.targetName;
        }
    }

    if (req.query.targetVal) {
        let tVal = parseFloat(req.query.targetVal);
        console.log(tVal);

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

    req.query.targetVal = targetVal;
    req.query.targetName = targetName;

    return next();
}

const INTERNAL_TARGET_NAME = {
    lamp: "scoreData.lampIndex",
    grade: "scoreData.gradeIndex",
    percent: "scoreData.percent",
    score: "scoreData.score",
};

router.get(
    "/timeline",
    ValidateTimelineValues,
    ValidateUserID,
    ValidateRivalGroupID,
    async function (req, res) {
        let targetVal = req.query.targetVal;
        let targetName = req.query.targetName;
        let requestedUserID = req.requestedUserID;

        let folder = req.folderData;
        let playtype = req.query.playtype || config.defaultPlaytype[folder.game];

        if (!config.validPlaytypes[folder.game].includes(playtype)) {
            return res.status(400).json({
                success: false,
                description: "Playtype provided, but the one given was invalid.",
            });
        }

        let difficulty = req.query.difficulty || null;

        if (req.query.difficulty && !config.validDifficulties[folder.game].includes(difficulty)) {
            return res.status(400).json({
                success: false,
                description: "Difficulty provided, but the one given was invalid.",
            });
        }

        let { songs, charts } = await folderCore.GetDataFromFolderQuery(
            folder,
            playtype,
            difficulty
        );

        let scoreData = await db.get("scores").aggregate([
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
            description: "hey",
            body: {
                songs,
                charts,
                scores,
            },
        });
    }
);

export default router;
