const db = require("../db.js");

async function EvaluateGoalForUser(goalID, userID){
    let goalObj = await db.get("goals").findOne({
        goalID: goalID
    });

    if (!goalObj){
        // todo properly
        throw `goalObj with ID ${goalID} does not exist anymore.`;
    }

    let chartIDs = await GetChartIDsFromGoal(goalObj);

    let method = "count";
    if (goalObj.criteria.type === "anyMatch"){
        method = "findOne"
    }

    let formattedScoreQuery = ConvertKeynames(goalObj.scoreQuery);

    let result = await db.get("scores")[method](
        Object.assign({
            chartID: {$in: chartIDs},
            userID: userID
        },
            formattedScoreQuery
        )
    );

    if (goalObj.criteria.type === "anyMatch"){
        let key = Object.keys(formattedScoreQuery)[0];

        let pb;
        let r = 0;
        if (key === "scoreData.lampIndex"){
            pb = await db.get("scores").findOne({
                chartID: {$in: chartIDs},
                userID: userID,
                isLampPB: true
            });
        }
        else {
            pb = await db.get("scores").findOne({
                chartID: {$in: chartIDs},
                userID: userID,
                isScorePB: true
            });
        }

        if (pb) {
            let keys = key.split(".");
    
            r = pb;
            for (const k of keys) {
                r = r[k];
            }
        }

        return {result: r, success: !!result};
    }
    
    let value = goalObj.criteria.value;

    if (goalObj.criteria.type === "gt"){
        return {result, success: result > value};
    }
    else if (goalObj.criteria.type === "gte"){
        return {result, success: result >= value};
    }
    // these don't really make sense for goals, so they're just commented out.
    // else if (goalObj.criteria.type === "lt"){
    //     return result < value;
    // }
    // else if (goalObj.criteria.type === "lte"){
    //     return result <= value;
    // }
    else if (goalObj.criteria.type === "eq"){
        return {result, success: result === value};
    }
    else {
        return {result}; // ????
    }
}

function ConvertKeynames(obj){
    let newObj = {};
    for (const key in obj) {
        if (typeof obj[key] === "object" && obj[key]){
            obj[key] = ConvertKeynames(obj[key])
        }
        newObj[key.replace(/¬/g, ".").replace(/^~/, "$")] = obj[key];
    }

    return newObj;
}

function GetGoalIDsFromMilestone(milestone){
    return milestone.milestoneData.map(e => e.goals.map(e => e.goalID)).flat();
}

async function GetChartIDsFromGoal(goalObj){
    if (goalObj.directChartID) {
        return [goalObj.directChartID];
    }

    let formattedChartQuery = ConvertKeynames(goalObj.chartQuery.query);

    let charts = await db.get(goalObj.chartQuery.collection).find(formattedChartQuery);
    return charts.map(e => e.chartID);
}

async function CreateUserGoal(goal, userID){
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
        progressHuman: null
    }

    let goalStatus = await EvaluateGoalForUser(goal.goalID, userID);

    ugObj.achieved = goalStatus.success;
    ugObj.progress = goalStatus.result;
    await db.get("user-goals").insert(ugObj);
    
    return ugObj;
}

module.exports = {
    EvaluateGoalForUser,
    GetGoalIDsFromMilestone,
    CreateUserGoal
}