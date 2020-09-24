const express = require("express");
const dbCore = require("../../../core/db-core.js");
const router = express.Router({mergeParams: true});
const db = require("../../../db.js");

// mounted on /api/v1/goal-sets

const MAX_RETURNS = 100;
router.get("/", async function(req,res){
    try {
        let dbRes = await dbCore.FancyDBQuery(
            "goal-sets",
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

module.exports = router;