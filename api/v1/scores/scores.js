const db = require("../../../db.js");
const express = require("express");
const router = express.Router({mergeParams: true});
const scoreHelpers = require("../../../helpers/scorehelpers.js");
const config = require("../../../config/config.js");

// mounted on /api/v1/scores

router.get("/", async function(req,res){
    let scoreCount = await db.get("scores").count({});
    let gameCount = {}
    for (const game of config.supportedGames) {
        gameCount[game] = await db.get("scores").count({game: game});
    }
    return res.status(200).json({
        success: true,
        description: "Kamaitachi is live and powering " + scoreCount + " scores.",
        body:{
            scoreCount: scoreCount,
            gameCount: gameCount
        }
    });
});

router.get("/query", async function(req,res){
    let scoreBody = await scoreHelpers.GetScoresWithQuery(req.query);

    return res.status(200).json({
        success: true,
        description: "Successfully retrieved " + scoreBody.items.length + " scores.",
        body: scoreBody
    })
});

module.exports = router;