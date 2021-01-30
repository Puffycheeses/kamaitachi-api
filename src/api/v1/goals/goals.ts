import * as express from "express";
import dbCore from "../../../core/db-core";
const router = express.Router({ mergeParams: true });
import db from "../../../db";
import config from "../../../config/config";
import JSum from "jsum";
import apiConfig from "../../../apiconfig";
import middlewares from "../../../middlewares";

// mounted on /api/v1/goals

const MAX_RETURNS = 100;
router.get("/", async (req, res) => {
    try {
        let dbRes = await dbCore.FancyDBQuery("goals", req.query, true, MAX_RETURNS);

        if (dbRes.body.success) {
            if (req.query.getAssocUsers) {
                dbRes.body.body.users = await db.get("users").find(
                    {
                        id: { $in: dbRes.body.body.items.map((e) => e.createdBy) },
                    },
                    {
                        projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS,
                    }
                );
            }

            // lol
            if (req.query.getAssocUserGoalCounts) {
                let ugc = await db.get("user-goals").aggregate([
                    {
                        $match: {
                            goalID: { $in: dbRes.body.body.items.map((e) => e.goalID) },
                        },
                    },
                    {
                        $group: {
                            _id: "$goalID",
                            count: { $sum: 1 },
                        },
                    },
                ]);

                let ugcObj = {};
                for (const ug of ugc) {
                    ugcObj[ug._id] = ug.count;
                }

                dbRes.body.body.ugc = ugcObj;
            }
        }
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

async function RequireValidGame(req, res, next) {
    if (!req.body.game) {
        return res.status(400).json({
            success: false,
            description: "No game provided.",
        });
    }

    if (!config.supportedGames.includes(req.body.game)) {
        return res.status(400).json({
            success: false,
            description: `Game ${req.body.game} is not supported.`,
        });
    }

    next();
}

const SUPPORTED_SCORE_GOAL_KEYS = {
    "scoreData.score": "float",
    "scoreData.percent": "float",
    "scoreData.gradeIndex": "integer",
    "scoreData.lampIndex": "integer",
    // "scoreData.esd": "float",
    // isScorePB: "boolean",
    // isLampPB: "boolean"
};

// const HUMAN_SCORE_GOAL_OPT = {
//     lt: "<",
//     lte: "<=",
//     gt: ">",
//     gte: ">=",
// };

const HUMAN_SCORE_GOAL_KEY = {
    "scoreData.score": "Score",
    "scoreData.percent": "Percent",
    "scoreData.gradeIndex": "Grade",
    "scoreData.lampIndex": "Lamp",
    // "scoreData.esd": "ESD",
};

router.put("/create-simple-chart-goal", RequireValidGame, async (req, res) => {
    if (!req.body.chartID) {
        return res.status(400).json({
            success: false,
            description: "No chartID provided.",
        });
    }

    if (!SUPPORTED_SCORE_GOAL_KEYS[req.body.scoreGoalKey]) {
        return res.status(400).json({
            success: false,
            description: `Invalid scoreGoalKey of ${req.body.scoreGoalKey}`,
        });
    }

    let gVal = parseFloat(req.body.scoreGoalValue);

    if (!gVal && gVal !== 0) {
        return res.status(400).json({
            success: false,
            description: `Bad value for scoreGoalValue (${req.body.scoreGoalValue}), could not be coerced into float.`,
        });
    }

    if (gVal <= 0) {
        return res.status(400).json({
            success: false,
            description: `Bad value for scoreGoalValue (${req.body.scoreGoalValue}), Must be positive.`,
        });
    }

    let game = req.body.game;
    let chart = await db.get(`charts-${game}`).findOne({
        chartID: req.body.chartID,
    });

    if (!chart) {
        return res.status(400).json({
            success: false,
            description: `Chart with ID ${req.body.chartID} does not exist.`,
        });
    }

    if (req.body.scoreGoalKey === "scoreData.lampIndex") {
        if (!config.lamps[game][gVal]) {
            return res.status(400).json({
                success: false,
                description: "Invalid value for lamp.",
            });
        }
    } else if (req.body.scoreGoalKey === "scoreData.gradeIndex") {
        if (!config.grades[game][gVal]) {
            return res.status(400).json({
                success: false,
                description: "Invalid value for grade.",
            });
        }
    } else if (req.body.scoreGoalKey === "scoreData.percent") {
        if (game !== "maimai" && gVal > 100.0) {
            return res.status(400).json({
                success: false,
                description: "Invalid value for percent.",
            });
        }
    }
    // todo, obvious refactor
    else if (req.body.scoreGoalKey === "scoreData.score") {
        if (game === "iidx" && gVal > chart.notedata.notecount * 2) {
            return res.status(400).json({
                success: false,
                description: `Invalid value for score, cannot be greater than ${
                    chart.notedata.notecount * 2
                }`,
            });
        } else if (game === "sdvx" && gVal > 10000000) {
            return res.status(400).json({
                success: false,
                description: "Invalid value for score, cannot be greater than 10,000,000",
            });
        } else if (["jubeat", "museca", "ddr"].includes(game) && gVal > 1000000) {
            return res.status(400).json({
                success: false,
                description: "Invalid value for score, cannot be greater than 1,000,000",
            });
        } else if (game === "popn" && gVal > 100000) {
            return res.status(400).json({
                success: false,
                description: "Invalid value for score, cannot be greater than 100,000",
            });
        }
    }

    // mongoDB (sensibly) doesn't let us use .'s or $'s in keynames
    // as they're special characters for special mongo functions.
    // given that we want to store queries, we are going to use the following replacement.
    // . => ¬
    // $ => ~
    // things reading from this db will have to convert accordingly.

    let queryVal = { "~gte": gVal };

    // there's literally no point in having any of these BUT gte. will just be confusing - zkldi.
    // if (req.body.scoreGoalOpt === "lte"){
    //     queryVal = {"~lte": gVal}
    // }
    // else if (req.body.scoreGoalOpt === "lt"){
    //     queryVal = {"~lt": gVal}
    // }
    // else if (req.body.scoreGoalOpt === "gt"){
    //     queryVal = {"~gt": gVal}
    // }
    // else if (req.body.scoreGoalOpt === "gte"){
    //     queryVal = {"~gte": gVal}
    // }

    let scoreQuery = {
        [req.body.scoreGoalKey.replace(/\./g, "¬")]: queryVal,
    };

    if (req.body.scoreGoalKey === "scoreData.lampIndex") {
        scoreQuery.isLampPB = true;
    } else {
        scoreQuery.isScorePB = true;
    }

    let goalObj = {
        directChartID: req.body.chartID,
        scoreQuery,
        criteria: {
            type: "anyMatch",
            value: null,
        },
        chartQuery: null,
    };

    let goalID = JSum.digest(goalObj, "SHA1", "hex");

    let exists = await db.get("goals").findOne({
        goalID: goalID,
    });

    if (exists) {
        // TECHNICALLY this should be a 409, but the api docs indicate that an erroneous response should not have a body.
        // BUT, we want to send a body to the user so they can be redirected to the already existing goalID.
        // so, we're going to deviate from the spec a little here.
        // plus, the outcome is still that of a success.

        return res.status(200).json({
            success: true,
            description: "Goal already exists.",
            body: exists,
        });
    }

    // if it doesnt already exist, we're going to have to create a title
    // for the goal. this is kinda wack humanizing.

    let song = await db.get(`songs-${game}`).findOne({
        id: chart.id,
    });

    if (!song) {
        console.error(`FATAL: chart ${chart.chartID} has no parent song.`);
        return res.status(500).json({
            success: false,
            description: "(ISE): This chart has no parent song.",
        });
    }

    let prettyValue = req.body.scoreGoalValue;

    if (req.body.scoreGoalKey === "scoreData.lampIndex") {
        prettyValue = config.lamps[game][gVal];
    } else if (req.body.scoreGoalKey === "scoreData.gradeIndex") {
        prettyValue = config.grades[game][gVal];
    }

    let humanTitle = `${song.title} (${config.FormatDifficulty(chart, game)}) ${
        HUMAN_SCORE_GOAL_KEY[req.body.scoreGoalKey]
    }: ${prettyValue}`;

    goalObj.title = humanTitle;
    goalObj.goalID = goalID;
    goalObj.timeAdded = Date.now();
    goalObj.createdBy = req.apikey.assignedTo;
    goalObj.game = game;
    goalObj.playtype = chart.playtype;

    await db.get("goals").insert(goalObj);

    return res.status(201).json({
        success: true,
        description: "Successfully created goal.",
        body: goalObj,
    });
});

router.put(
    "/create-advanced-goal",
    RequireValidGame,
    middlewares.RequireAdmin,
    async (req, res) => {
        let gVal = parseFloat(req.body.sgVal);

        if (req.body.sgKey === "scoreData.gradeIndex") {
            gVal = config.grades[req.body.game].indexOf(req.body.sgVal);
        } else if (req.body.sgKey === "scoreData.lampIndex") {
            gVal = config.lamps[req.body.game].indexOf(req.body.sgVal);
        }

        let scoreQuery = {
            [req.body.sgKey.replace(/\./g, "¬")]: { "~gte": gVal },
        };

        if (gVal < 0) {
            return res.status(400).json({
                success: false,
                description: "gval is less than 0",
            });
        }

        let goalObj = {
            directChartID: null,
            directChartIDs: req.body.directChartIDs || null,
            chartQuery: req.body.chartQuery,
            scoreQuery,
            criteria: {
                type: req.body.criteria,
                value: parseFloat(req.body.value),
                mode: req.body.mode || null,
            },
        };

        let goalID = JSum.digest(goalObj, "SHA1", "hex");

        let exists = await db.get("goals").findOne({
            goalID: goalID,
        });

        if (exists) {
            return res.status(200).json({
                success: true,
                description: "Goal already exists.",
                body: exists,
            });
        }

        goalObj.title = `${req.body.title} (${req.body.playtype})`;
        goalObj.goalID = goalID;
        goalObj.timeAdded = Date.now();
        goalObj.createdBy = req.apikey.assignedTo;
        goalObj.game = req.body.game;
        goalObj.playtype = req.body.playtype;

        await db.get("goals").insert(goalObj);

        return res.status(201).json({
            success: true,
            description: "Successfully created goal.",
            body: goalObj,
        });
    }
);

import goalIDRouter from "./goalID/goalID";
router.use("/goal/:goalID", goalIDRouter);

export default router;
