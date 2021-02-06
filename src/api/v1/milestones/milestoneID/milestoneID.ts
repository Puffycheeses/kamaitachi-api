import * as express from "express";
import goalCore from "../../../../core/goal-core";
const router = express.Router({ mergeParams: true });
import db from "../../../../db";

/**
 * @namespace /v1/milestones/milestone/:milestoneID
 */

async function ValidateMilestoneID(
    req: KTRequest,
    res: express.Response,
    next: express.NextFunction
) {
    let milestone = await db.get("milestones").findOne({
        milestoneID: req.params.milestoneID,
    });

    if (!milestone) {
        return res.status(404).json({
            success: false,
            description: `No milestone with ID ${req.params.milestoneID} could be found.`,
        });
    }

    req.ktchiMilestone = milestone;

    next();
}

router.use(ValidateMilestoneID);

/**
 * Returns the milestone at this milestoneID.
 * @name GET /v1/milestones/milestone/:milestoneID
 */
router.get("/", async (req, res) =>
    res.status(200).json({
        success: true,
        description: `Successfully found goal ${req.ktchiMilestone!.title}.`,
        body: req.ktchiMilestone,
    })
);

/**
 * Sets this milestone to the requesting user.
 * @name POST /v1/milestones/milestone/:milestoneID/set-milestone
 */
router.post("/set-milestone", async (req, res) => {
    let userID = req.apikey!.assignedTo;

    let milestone = req.ktchiMilestone as MilestoneDocument;
    let exists = await db.get("user-milestones").findOne({
        userID,
        milestoneID: req.params.milestoneID,
    });

    if (exists) {
        return res.status(409).json({
            success: false,
            description: "You already have this milestone set.",
        });
    }

    // else create user-milestone obj
    let umObj: UserMilestoneDocument = {
        milestoneID: req.params.milestoneID,
        userID,
        game: milestone.game,
        playtype: milestone.playtype,
        timeSet: Date.now(),
        achieved: false,
        timeAchieved: null,
        progress: 0,
    };

    let goalIDs = goalCore.GetGoalIDsFromMilestone(milestone);

    let successCount = 0;

    // this is hilariously slow??
    // TODO: optimise this in the obvious manner
    for (const goalID of goalIDs) {
        let goalIDExists = await db.get("user-goals").findOne({
            goalID: goalID,
            userID,
        });

        if (goalIDExists) {
            if (goalIDExists.achieved) {
                successCount++;
            }
            continue;
        }

        let goal = await db.get("goals").findOne({
            goalID: goalID,
        });

        let ugObj = await goalCore.CreateUserGoal(goal, userID);

        if (ugObj.achieved) {
            successCount++;
        }
    }

    umObj.progress = successCount;

    if (milestone.criteria.type === "all") {
        umObj.achieved = successCount >= goalIDs.length;
    } else if (milestone.criteria.type === "percent") {
        if (milestone.criteria.value === null) {
            console.error(
                `Corrupt Milestone: ${milestone.milestoneID}, null value with type percent.`
            );

            return res.status(500).json({
                success: false,
                description:
                    "Internal service error while assigning goal. Milestone object is corrupt.",
            });
        }

        umObj.achieved = successCount >= goalIDs.length * milestone.criteria.value;
    } else if (milestone.criteria.type === "count") {
        if (milestone.criteria.value === null) {
            console.error(
                `Corrupt Milestone: ${milestone.milestoneID}, null value with type count.`
            );

            return res.status(500).json({
                success: false,
                description:
                    "Internal service error while assigning goal. Milestone object is corrupt.",
            });
        }

        umObj.achieved = successCount >= milestone.criteria.value;
    }

    if (umObj.achieved) {
        umObj.timeAchieved = Date.now();
    }

    await db.get("user-milestones").insert(umObj);

    return res.status(201).json({
        success: true,
        description: `Successfully added milestone ${milestone.title}.`,
        body: umObj,
    });
});

/**
 * Removes (or unsets) the milestone at this given ID for the requesting user.
 * @name POST /v1/milestones/milestone/:milestoneID/remove-milestone
 */
router.post("/remove-milestone", async (req, res) => {
    let userID = req.apikey!.assignedTo;

    let exists = await db.get("user-milestones").findOne({
        userID: userID,
        milestoneID: req.params.milestoneID,
    });

    if (!exists) {
        return res.status(404).json({
            success: false,
            description: `You do not have the milestone ${req.params.milestoneID} set.`,
        });
    }

    await db.get("user-milestones").remove({
        _id: exists._id,
    });

    let milestone = req.ktchiMilestone as MilestoneDocument;

    let goalIDs = goalCore.GetGoalIDsFromMilestone(milestone);

    await db.get("user-goals").remove({
        goalID: { $in: goalIDs },
        userID: userID,
    });

    return res.status(200).json({
        success: true,
        description: "Successfully removed milestone.",
        body: exists,
    });
});

export default router;
