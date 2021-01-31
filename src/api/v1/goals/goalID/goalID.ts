import * as express from "express";
import goalCore from "../../../../core/goal-core";
const router = express.Router({ mergeParams: true });
import db from "../../../../db";

/**
 * @namespace /v1/goals/goal/:goalID
 */

async function ValidateGoalID(req: KTRequest, res: express.Response, next: express.NextFunction) {
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

/**
 * Retreives the goal at the given ID.
 * @name GET /v1/goals/goal/:goalID
 */
router.get("/", async (req, res) =>
    res.status(200).json({
        success: true,
        description: `Successfully found goal ${req.ktchiGoal!.title}.`,
        body: req.ktchiGoal,
    })
);

/**
 * Assigns a given goal id to the requesting user.
 * @name PATCH /v1/goals/goal/:goalID/assign-goal
 */
router.patch("/assign-goal", async (req, res) => {
    let goal = req.ktchiGoal as GoalDocument;
    let exists = await db.get("user-goals").findOne({
        userID: req.apikey!.assignedTo,
        goalID: req.params.goalID,
    });

    if (exists) {
        return res.status(409).json({
            success: false,
            description: "You already have this goal assigned.",
        });
    }

    // else create user-goals obj
    let ugObj = await goalCore.CreateUserGoal(goal, req.apikey!.assignedTo);

    return res.status(201).json({
        success: true,
        description: `Successfully added goal ${goal.title}.`,
        body: ugObj,
    });
});

/**
 * Removes the given goalID from the requesting user.
 * @name DELETE /v1/goals/goal/:goalID/remove-goal
 */
router.delete("/remove-goal", async (req, res) => {
    let exists = await db.get("user-goals").findOne({
        userID: req.apikey!.assignedTo,
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
