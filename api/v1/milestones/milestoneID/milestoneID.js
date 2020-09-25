const express = require("express");
const dbCore = require("../../../../core/db-core.js");
const goalCore = require("../../../../core/goal-core.js");
const router = express.Router({mergeParams: true});
const db = require("../../../../db.js");
const config = require("../../../../config/config.js");

// mounted on /api/v1/milestones/milestone/:milestoneID

async function ValidateMilestoneID(req, res, next){
    let milestone = await db.get("milestones").findOne({
        milestoneID: req.params.milestoneID
    });

    if (!milestone){
        return res.status(404).json({
            success: false,
            description: `No milestone with ID ${req.params.milestoneID} could be found.`
        });
    }

    req.ktchiMilestone = milestone;

    next();
}

router.use(ValidateMilestoneID);

router.get("/", async function (req,res) {
    return res.status(200).json({
        success: true,
        description: `Successfully found goal ${req.ktchiMilestone.title}.`,
        body: req.ktchiMilestone
    });
});

// this code is almost identical to the goalID setting.
router.patch("/set-milestone", async function (req,res){
    let milestone = req.ktchiMilestone;
    let exists = await db.get("user-milestones").findOne({
        userID: req.apikey.assignedTo,
        milestoneID: req.params.milestoneID
    });
    
    if (exists){
        return res.status(409).json({
            success: false,
            description: "You already have this milestone set."
        });
    }

    // else create user-milestone obj
    let umObj = {
        milestoneID: req.params.milestoneID,
        userID: req.apikey.assignedTo,
        game: milestone.game,
        playtype: milestone.playtype,
        timeSet: Date.now(),
        achieved: false,
        timeAchieved: null,
        progress: null
    }

    let goalIDs = goalCore.GetGoalIDsFromMilestone(milestone);

    let successCount = 0;

    for (const goalID of goalIDs) {
        let goalIDExists = await db.get("user-goals").findOne({
            goalID: goalID,
            userID: req.apikey.assignedTo
        });

        if (goalIDExists){
            if (goalIDExists.achieved) { successCount++; }
            continue;
        }

        let ugObj = await goalCore.CreateUserGoal(goal, req.apikey.assignedTo);

        if (ugObj.achieved) { successCount++; }
    }

    umObj.progress = successCount;

    if (milestone.criteria === -1){
        umObj.achieved = successCount >= goalIDs.length;
    }
    else {
        umObj.achieved = successCount >= milestone.criteria;
    }

    if (umObj.achieved){
        umObj.timeAchieved = Date.now();
    }

    await db.get("user-milestones").insert(umObj);

    return res.status(201).json({
        success: true,
        description: `Successfully added milestone ${req.milestone.title}.`,
        body: umObj
    })
});

router.delete("/remove-milestone", async function (req,res) {
    let exists = await db.get("user-milestones").findOne({
        userID: req.apikey.assignedTo,
        milestoneID: req.params.milestoneID
    });

    if (!exists){
        return res.status(404).json({
            success: false,
            description: `You do not have the milestone ${req.params.milestoneID} set.`
        });
    }

    await db.get("user-milestones").remove({
        _id: exists._id
    });

    let milestone = req.ktchiMilestone;

    let goalIDs = goalCore.GetGoalIDsFromMilestone(milestone);

    await db.get("user-goals").remove({
        goalID: {$in: goalIDs},
        userID: req.apikey.assignedTo
    });

    return res.status(200).json({
        success: true,
        description: "Successfully removed milestone.",
        body: exists
    });
});

module.exports = router;