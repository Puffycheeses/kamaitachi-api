const express = require("express");
const dbCore = require("../../../core/db-core.js");
const router = express.Router({mergeParams: true});
const db = require("../../../db.js");

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

// todo: cache or paginate, i guess
router.get("/user-goals", async function(req,res){
    if (!req.query.userID){
        return res.status(400).json({
            success: false,
            description: "No userID provided."
        });
    }

    let userGoals = await db.get("user-goals").find({
        userID: parseInt(req.query.userID)
    });

    let queryObj = {
        goalID: {$in: userGoals.map(e => e.goalID)}
    };

    if (req.query.game){
        queryObj.game = req.query.game;
    }

    if (req.query.playtype){
        queryObj.playtype = req.query.playtype;
    }

    let goals = await db.get("goals").find(queryObj);

    return res.status(200).json({
        success: true,
        description: `Found goals for userID ${parseInt(req.query.userID)}`,
        body: {
            userGoals: userGoals,
            goals: goals
        }
    });
});

module.exports = router;