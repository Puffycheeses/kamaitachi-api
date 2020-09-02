const express = require("express");
const router = express.Router({mergeParams: true});
const dbHelpers = require("../../../core/db-core.js");

// mounted on /api/v1/clans

router.get("/", async function(req,res){

    try {
        let dbRes = await dbHelpers.FancyDBQuery(
            "clans",
            req.query,
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

// mounts
const clanRouter = require("./clanID/clanID.js");

router.use("/:clanID", clanRouter);

module.exports = router;