const express = require("express");
const router = express.Router({mergeParams: true});
const userHelpers = require("../../../../../core/user-core.js");
const middlewares = require("../../../../../middlewares.js");
const dbHelpers = require("../../../../../core/db-core.js");
const db = require("../../../../../db.js");

// mounted on /api/v1/users/:userID/scores

router.get("/count", async function(req,res){
    let user = req.user;

    req.query.userID = "" + user.id;

    if (req.query.playtype){
        req.query["scoreData.playtype"] = req.query.playtype;
    }

    try {
        let dbRes = await dbHelpers.FancyDBQuery(
            "scores",
            req.query,
            false,
            null,
            null,
            true
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

router.get("/heatmap", async function(req,res){
    let user = req.user;

    // actually, its just 365 days, but you know how it is.
    const ONE_YEAR = 31536000000; // 1000 * 60 * 60 * 24 * 365

    // todo, let people pass custom values to this
    let endPoint = Date.now();
    let startPoint = endPoint - ONE_YEAR;

    let queryObj = {
        userID: user.id,
        timeAchieved: {$gt: startPoint}
    }

    if (req.query.game){
        queryObj.game = req.query.game;
    }

    if (req.query.playtype){
        queryObj["scoreData.playtype"] = req.query.playtype
    }

    let timeData = await db.get("scores").find(queryObj, {
        fields: {timeAchieved: 1}
    });

    return res.status(200).json({
        success: true,
        description: "Successfully got heatmap data for " + req.params.userID,
        body: {
            data: timeData.map(e => e.timeAchieved)
        }
    })
});

module.exports = router;