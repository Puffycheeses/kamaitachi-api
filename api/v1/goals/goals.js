const express = require("express");
const dbCore = require("../../../core/db-core.js");
const router = express.Router({mergeParams: true});
const db = require("../../../db.js");
const config = require("../../../config/config.js");
const JSum = require("jsum");

// mounted on /api/v1/goals

const MAX_RETURNS = 100;
router.get("/", async function(req,res){
    try {
        let dbRes = await dbCore.FancyDBQuery(
            "goals",
            req.query,
            true,
            MAX_RETURNS
        );
        return res.status(dbRes.statusCode).json(dbRes.body);
    }
    catch (r) {
        if (r.statusCode && r.body){
            return res.status(r.statusCode).json(r.body);
        }
        else {
            console.error(req.originalUrl);
            console.error(r);
            return res.status(500).json({
                success: false,
                description: "An unknown internal server error has occured."
            });
        }
    }
});

async function RequireValidGame(req, res, next){
    if (!req.body.game){
        return res.status(400).json({
            success: false,
            description: "No game provided."
        });
    }

    if (!config.supportedGames.includes(req.body.game)){
        return res.status(400).json({
            success: false,
            description: `Game ${req.body.game} is not supported.`
        });
    }

    next();
}

const SUPPORTED_SCORE_GOAL_KEYS = {
    "scoreData.score": "float",
    "scoreData.percent": "float",
    "scoreData.gradeIndex": "integer",
    "scoreData.lampIndex": "integer",
    "scoreData.esd": "float",
    // isScorePB: "boolean",
    // isLampPB: "boolean"
}

const HUMAN_SCORE_GOAL_OPT = {
    "lt": "<",
    "lte": "<=",
    "gt": ">",
    "gte": ">="
}

const HUMAN_SCORE_GOAL_KEY = {
    "scoreData.score": "Score",
    "scoreData.percent": "Percent",
    "scoreData.gradeIndex": "Grade",
    "scoreData.lampIndex": "Lamp",
    "scoreData.esd": "ESD",
}

router.put("/create-simple-chart-goal", RequireValidGame, async function(req,res) {
    if (!req.body.chartID){
        return res.status(400).json({
            success: false,
            description: "No chartID provided."
        });
    }

    if (!SUPPORTED_SCORE_GOAL_KEYS[req.body.scoreGoalKey]){
        return res.status(400).json({
            success: false,
            description: `Invalid scoreGoalKey of ${req.body.scoreGoalKey}`
        });
    }

    let gVal = parseFloat(req.body.scoreGoalValue);

    if (!gVal && gVal !== 0){
        return res.status(400).json({
            success: false,
            description: `Bad value for scoreGoalValue (${req.body.scoreGoalValue}), could not be coerced into float.`
        });
    }

    if (gVal <= 0){
        return res.status(400).json({
            success: false,
            description: `Bad value for scoreGoalValue (${req.body.scoreGoalValue}), Must be positive.`
        })
    }

    let game = req.body.game;

    let chart = await db.get(`charts-${game}`).findOne({
        chartID: req.body.chartID
    });

    if (!chart) {
        return res.status(400).json({
            success: false,
            description: `Chart with ID ${req.body.chartID} does not exist.`
        });
    }

    // mongoDB (sensibly) doesn't let us use .'s or $'s in keynames
    // as they're special characters for special mongo functions.
    // given that we want to store queries, we are going to use the following replacement.
    // . => ¬
    // $ => ~
    // things reading from this db will have to convert accordingly.

    let queryVal = {"~gte": gVal};

    if (req.body.scoreGoalOpt === "lte"){
        queryVal = {"~lte": gVal}
    }
    else if (req.body.scoreGoalOpt === "lt"){
        queryVal = {"~lt": gVal}
    }
    else if (req.body.scoreGoalOpt === "gt"){
        queryVal = {"~gt": gVal}
    }
    else if (req.body.scoreGoalOpt === "gte"){
        queryVal = {"~gte": gVal}
    }

    let scoreQuery = {
        [req.body.scoreGoalKey.replace(/\./g, "¬")]: queryVal
    };

    let goalObj = {
        directChartID: req.body.chartID,
        scoreQuery,
        criteria: {
            type: "anyMatch",
            value: null
        },
        chartQuery: null
    }

    let goalID = JSum.digest(goalObj, "SHA1", "hex");

    let exists = await db.get("goals").findOne({
        goalID: goalID
    });

    if (exists){
        return res.status(200).json({
            success: true,
            description: "Goal already exists.",
            body: exists
        })
    }

    // if it doesnt already exist, we're going to have to create a title
    // for the goal. this is kinda wack humanizing.

    let song = await db.get(`songs-${game}`).findOne({
        id: chart.id
    });

    if (!song){
        console.error(`FATAL: chart ${chart.chartID} has no parent song.`);
        return res.status(500).json({
            success: false,
            description: "(ISE): This chart has no parent song."
        });
    }

    let prettyValue = req.body.scoreGoalValue;

    if (req.body.scoreGoalKey === "scoreData.lampIndex"){
        prettyValue = config.lamps[game][gVal];
    }
    else if (req.body.scoreGoalKey === "scoreData.gradeIndex"){
        prettyValue = config.grades[game][gVal];
    }

    let humanTitle = `${song.title} (${config.FormatDifficulty(chart, game)}) ${HUMAN_SCORE_GOAL_KEY[req.body.scoreGoalKey]} ${HUMAN_SCORE_GOAL_OPT[req.body.scoreGoalOpt] || ">="} ${prettyValue}`;

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
        body: goalObj
    });
});

const goalIDRouter = require("./goalID/goalID.js");
router.use("/goal/:goalID", goalIDRouter);

module.exports = router;