const db = require("../db.js");
const config = require("../config/config.js");

async function EvaluateGoalForUser(goalID, userID) {
    let goalObj = await db.get("goals").findOne({
        goalID: goalID,
    });

    if (!goalObj) {
        // todo properly
        throw `goalObj with ID ${goalID} does not exist anymore.`;
    }

    let chartIDs = await GetChartIDsFromGoal(goalObj);

    let method = "count";
    if (goalObj.criteria.type === "anyMatch") {
        method = "findOne";
    }

    let formattedScoreQuery = ConvertKeynames(goalObj.scoreQuery);

    let baseObj = {
        userID: userID,
        game: goalObj.game,
        "scoreData.playtype": goalObj.playtype,
    };

    // if null, we are looking for the set of all charts.
    if (chartIDs) {
        baseObj.chartID = { $in: chartIDs };
    }

    let result = await db.get("scores")[method](Object.assign(baseObj, formattedScoreQuery));

    if (goalObj.criteria.type === "anyMatch") {
        let keys = Object.keys(formattedScoreQuery);

        // do some hackery to set "r" as the "result" of the query,
        // since the above query is only checking count against count (i.e. 5 hcs against 10 hcs)
        // when we want something like: score 740 against score 800
        let pb;
        let r = 0;
        if (keys.includes("scoreData.lampIndex")) {
            pb = await db.get("scores").findOne({
                chartID: { $in: chartIDs },
                userID: userID,
                isLampPB: true,
            });
        } else {
            pb = await db.get("scores").findOne({
                chartID: { $in: chartIDs },
                userID: userID,
                isScorePB: true,
            });
        }

        if (pb) {
            let keyxs = keys[0].split(".");

            r = pb;
            for (const k of keyxs) {
                r = r[k];
            }
        }

        // BIG RED HACK WARNING AAA
        let outOf = formattedScoreQuery[keys[0]] && formattedScoreQuery[keys[0]].$gte ? formattedScoreQuery[keys[0]].$gte : null;
        return { result: r, outOf: outOf, success: !!result, goalObj };
    }

    let value = goalObj.criteria.value;

    if (goalObj.criteria.mode === "proportion") {
        value = Math.ceil(chartIDs.length * value);
    }

    if (goalObj.criteria.type === "gt") {
        return { result, success: result > value, goalObj };
    } else if (goalObj.criteria.type === "all" || value === -1) {
        // legacy
        return { result, outOf: chartIDs.length, success: result > chartIDs.length, goalObj };
    } else if (goalObj.criteria.type === "gte") {
        return { result, outOf: value, success: result >= value, goalObj };
    } else if (goalObj.criteria.type === "lt") {
        return { result, outOf: value, success: result < value, goalObj };
    } else if (goalObj.criteria.type === "lte") {
        return { result, outOf: value, success: result <= value, goalObj };
    } else if (goalObj.criteria.type === "eq") {
        return { result, outOf: value, success: result === value, goalObj };
    } else {
        return { result, outOf: value, success: false, goalObj }; // ???? failsafe
    }
}

function ConvertKeynames(obj) {
    let newObj = {};
    for (const key in obj) {
        if (typeof obj[key] === "object" && obj[key]) {
            obj[key] = ConvertKeynames(obj[key]);
        }
        newObj[key.replace(/¬/g, ".").replace(/^~/, "$")] = obj[key];
    }

    return newObj;
}

function GetGoalIDsFromMilestone(milestone) {
    return milestone.milestoneData.map((e) => e.goals.map((e) => e.goalID)).flat();
}

async function GetChartIDsFromGoal(goalObj) {
    if (goalObj.directChartID) {
        return [goalObj.directChartID];
    }

    if (goalObj.directChartIDs) {
        return goalObj.directChartIDs;
    }

    // if null, we don't care about any subset of charts
    if (!goalObj.chartQuery) {
        return null;
    }

    let formattedChartQuery = ConvertKeynames(goalObj.chartQuery.query);

    let charts = await db.get(goalObj.chartQuery.collection).find(formattedChartQuery);

    let chartIDs = charts.map((e) => e.chartID);

    if (goalObj.chartQuery.collection === "tierlistdata" && goalObj.game === "iidx") {
        chartIDs = charts.filter((e) => e.flags && e.flags["IN BASE GAME"]).map((e) => e.chartID); // hack fix for iidx
    }
    return chartIDs;
}

async function CreateUserGoal(goal, userID) {
    let ugObj = {
        goalID: goal.goalID,
        userID: userID,
        game: goal.game,
        playtype: goal.playtype,
        timeSet: Date.now(),
        achieved: false,
        timeAchieved: null,
        note: null,
        progress: null,
        progressHuman: null,
        outOf: null,
        outOfHuman: null,
    };

    let goalStatus = await EvaluateGoalForUser(goal.goalID, userID);

    let progressHuman = goalStatus.result;
    let outOfHuman = goalStatus.outOf;

    let goalObj = goalStatus.goalObj;

    if (goalObj.criteria.type === "anyMatch") {
        let keys = Object.keys(goal.scoreQuery);

        if (keys.includes("scoreData¬percent")) {
            progressHuman = `${goalStatus.result.toFixed(2)}%`;
            outOfHuman = `${goalStatus.outOf.toFixed(2)}%`;
        } else if (keys.includes("scoreData¬gradeIndex")) {
            progressHuman = config.grades[goalObj.game][goalStatus.result];
            outOfHuman = config.grades[goalObj.game][goalStatus.outOf];
        } else if (keys.includes("scoreData¬lampIndex")) {
            progressHuman = config.lamps[goalObj.game][goalStatus.result];
            outOfHuman = config.lamps[goalObj.game][goalStatus.outOf];
        }
    }

    ugObj.achieved = goalStatus.success;
    ugObj.progress = goalStatus.result;
    ugObj.progressHuman = progressHuman;
    ugObj.outOfHuman = outOfHuman;
    ugObj.outOf = goalStatus.outOf;

    await db.get("user-goals").insert(ugObj);

    return ugObj;
}

module.exports = {
    EvaluateGoalForUser,
    GetGoalIDsFromMilestone,
    CreateUserGoal,
};
