const db = require("../../../../../db.js");
const dbCore = require("../../../../../core/db-core.js");
const express = require("express");
const router = express.Router({mergeParams: true});

// mounted on /api/v1/games/:game/charts

const CHART_RET_LIMIT = 100;
router.get("/", async function(req,res){

    // hack fix for poor db naming.
    if (req.query.songID){
        req.query.id = req.query.songID;
    }

    try {
        let dbRes = await dbCore.FancyDBQuery(
            "charts-" + req.params.game,
            req.query,
            true,
            CHART_RET_LIMIT,
            "charts"
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

module.exports = router;