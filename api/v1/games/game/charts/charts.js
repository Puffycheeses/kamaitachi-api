const db = require("../../../../../db.js");
const dbHelpers = require("../../../../../core/db-core.js");
const express = require("express");
const router = express.Router({mergeParams: true});

// mounted on /api/v1/games/:game/charts

const CHART_RET_LIMIT = 100;
router.get("/", async function(req,res){

    // hack fix for poor db naming.
    if (req.query.songID){
        req.query.id = req.query.songID;
    }

    let dbRes = await dbHelpers.FancyDBQuery(
        "charts-" + req.params.game,
        req.query,
        true,
        CHART_RET_LIMIT,
        "charts"
    );

    return res.status(dbRes.statusCode).json(dbRes.body);
});

module.exports = router;    