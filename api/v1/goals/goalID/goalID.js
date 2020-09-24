const express = require("express");
const dbCore = require("../../../../core/db-core.js");
const router = express.Router({mergeParams: true});
const db = require("../../../../db.js");
const config = require("../../../../config/config.js");

// mounted on /api/v1/goals

async function ValidateGoalID(req, res, next){
    let goal = await db.get("goals").findOne({
        goalID: req.params.goalID
    });

    if (!goal){
        return res.status(404).json({
            success: false,
            description: `No goal with ID ${req.params.goalID} could be found.`
        });
    }

    req.ktchiGoal = goal;

    next();
}

router.use(ValidateGoalID);

router.get("/", async function (req,res) {
    return res.status(200).json({
        success: true,
        description: `Successfully found goal ${req.ktchiGoal.title}.`,
        body: req.ktchiGoal
    });
});

router.patch("/assign-self-goal", async function (req,res){
    let exists = await db.get("user-goals").findOne({
        userID: req.apikey.assignedTo,
        goalID: req.params.goalID
    });
    
    if (exists){
        return res.status(409).json({
            success: false,
            description: "You already have this goal assigned."
        });
    }

    // else create user-goals obj
    let ugObj = {
        goalID: req.params.goalID,
        userID: req.apikey.assignedTo,
        game: req.ktchiGoal.game,
        playtype: req.ktchiGoal.playtype,
        timeSet: Date.now(),
        achieved: false,
        timeAchieved: null,
        note: null
    }

    await db.get("user-goals").insert(ugObj);

    return res.status(201).json({
        success: true,
        description: `Successfully added goal ${req.ktchiGoal.title}.`,
        body: ugObj
    })
});

module.exports = router;