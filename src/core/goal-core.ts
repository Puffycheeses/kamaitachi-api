import db from "../db";
import config from "../config/config";
import { FilterQuery } from "mongodb";

interface EvaluatedGoalReturn {
    result: number;
    outOf: number;
    success: boolean;
    goalObj: GoalDocument;
}

/**
 * Evaluates a goal for a given user. Returns an object with various relevant parameters.
 * @param goalID The ID of the goal you wish to validate.
 * @param userID The userID the goal is validating for.
 */
async function EvaluateGoalForUser(goalID: string, userID: integer): Promise<EvaluatedGoalReturn> {
    let goalObj: GoalDocument = await db.get("goals").findOne({
        goalID: goalID,
    });

    if (!goalObj) {
        // todo properly
        throw `goalObj with ID ${goalID} does not exist anymore.`;
    }

    let chartIDs = await GetChartIDsFromGoal(goalObj);

    let formattedScoreQuery = ConvertKeynames(goalObj.scoreQuery);

    let baseObj: FilterQuery<ScoreDocument> = {
        userID: userID,
        game: goalObj.game,
        "scoreData.playtype": goalObj.playtype,
    };

    // if null, we are looking for the set of all charts.
    if (chartIDs) {
        baseObj.chartID = { $in: chartIDs };
    }

    if (goalObj.criteria.type === "anyMatch") {
        let result: ScoreDocument[] = await db
            .get("scores")
            .findOne(Object.assign(baseObj, formattedScoreQuery));

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

            let tempR = pb;
            for (const k of keyxs) {
                tempR = tempR[k];
            }

            r = tempR;
        }

        // @ts-expect-error The following line is a disgusting garbage hack for basic behaviour
        // and is a symptom of the ridiculously overengineered goal solution.
        let outOf = formattedScoreQuery[keys[0]]?.$gte ?? null;

        return { result: r, outOf: outOf, success: !!result, goalObj };
    }

    let result: number = await db.get("scores").count(Object.assign(baseObj, formattedScoreQuery));

    let value = goalObj.criteria.value;

    // -1 is legacy for stupid reasons
    if (goalObj.criteria.type === "all" || value === -1) {
        if (!Array.isArray(chartIDs)) {
            console.error(
                `Broken goal ${goalObj.goalID}, has no array of chartIDs but requests all or -1.`
            );
            throw {
                statusCode: 500,
                body: {
                    success: false,
                    description: "This goal is broken internally. This has been reported.",
                },
            };
        }
        return { result, outOf: chartIDs.length, success: result > chartIDs.length, goalObj };
    }

    if (!value) {
        console.error(`Invalid value of null for goal ${goalObj.goalID}`);
        throw {
            statusCode: 500,
            body: {
                success: false,
                description: "This goal is broken internally. This has been reported.",
            },
        };
    }

    if (goalObj.criteria.mode === "proportion") {
        if (!Array.isArray(chartIDs)) {
            // log error
            console.error(
                `Broken goal ${goalObj.goalID}, has no array of chartIDs but requests proportion.`
            );
            throw {
                statusCode: 500,
                body: {
                    success: false,
                    description: "Goal is broken.",
                },
            };
        }
        value = Math.ceil(chartIDs.length * value);
    }

    if (goalObj.criteria.type === "gt") {
        return { result, outOf: value, success: result > value, goalObj };
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

function ConvertKeynames(obj: Record<string, unknown>): Record<string, unknown> {
    let newObj: Record<string, unknown> = {};
    for (const key in obj) {
        if (typeof obj[key] === "object" && obj[key]) {
            obj[key] = ConvertKeynames(obj[key] as Record<string, unknown>);
        }
        newObj[key.replace(/¬/g, ".").replace(/^~/, "$")] = obj[key];
    }

    return newObj;
}

function GetGoalIDsFromMilestone(milestone: MilestoneDocument): string[] {
    return milestone.milestoneData.map((e) => e.goals.map((e) => e.goalID)).flat();
}

async function GetChartIDsFromGoal(goalObj: GoalDocument): Promise<string[] | null> {
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

/**
 *
 * @param goal
 * @param userID
 */

async function CreateUserGoal(goal: GoalDocument, userID: integer): Promise<UserGoalDocument> {
    let ugObj: UserGoalDocument = {
        goalID: goal.goalID,
        userID: userID,
        game: goal.game,
        playtype: goal.playtype,
        timeSet: Date.now(),
        achieved: false,
        timeAchieved: null,
        note: null,
        progress: 0,
        progressHuman: "",
        outOf: 0,
        outOfHuman: "",
    };

    let goalStatus = await EvaluateGoalForUser(goal.goalID, userID);

    let progressHuman = goalStatus.result.toString();
    let outOfHuman = goalStatus.outOf.toString();

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

export { EvaluateGoalForUser, GetGoalIDsFromMilestone, CreateUserGoal };
