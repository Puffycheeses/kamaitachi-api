import * as express from "express";
import dbCore from "../../../../core/db-core";
import goalCore from "../../../../core/goal-core";
const router = express.Router({ mergeParams: true });
import db from "../../../../db";
import config from "../../../../config/config";

// mounted on /api/v1/goals/goal/:goalID

async function ValidateGoalID(req, res, next) {
    let goal = await db.get("goals").findOne({
        goalID: req.params.goalID,
    });

    if (!goal) {
        return res.status(404).json({
            success: false,
            description: `No goal with ID ${req.params.goalID} could be found.`,
        });
    }

    req.ktchiGoal = goal;

    next();
}

router.use(ValidateGoalID);

router.get("/", async function (req, res) {
    return res.status(200).json({
        success: true,
        description: `Successfully found goal ${req.ktchiGoal.title}.`,
        body: req.ktchiGoal,
    });
});

router.patch("/assign-goal", async function (req, res) {
    let goal = req.ktchiGoal;
    let exists = await db.get("user-goals").findOne({
        userID: req.apikey.assignedTo,
        goalID: req.params.goalID,
    });

    if (exists) {
        return res.status(409).json({
            success: false,
            description: "You already have this goal assigned.",
        });
    }

    // else create user-goals obj
    let ugObj = await goalCore.CreateUserGoal(goal, req.apikey.assignedTo);

    return res.status(201).json({
        success: true,
        description: `Successfully added goal ${req.ktchiGoal.title}.`,
        body: ugObj,
    });
});

router.delete("/remove-goal", async function (req, res) {
    let exists = await db.get("user-goals").findOne({
        userID: req.apikey.assignedTo,
        goalID: req.params.goalID,
    });

    if (!exists) {
        return res.status(404).json({
            success: false,
            description: `You do not have the goal ${req.params.goalID} assigned.`,
        });
    }

    await db.get("user-goals").remove({
        _id: exists._id,
    });

    return res.status(200).json({
        success: true,
        description: "Successfully removed goal.",
        body: exists,
    });
});

export default router;
