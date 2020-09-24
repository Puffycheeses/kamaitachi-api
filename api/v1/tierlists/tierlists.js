const express = require("express");
const router = express.Router({mergeParams: true});
const dbCore = require("../../../core/db-core.js");

// mounted on /api/v1/tierlists

const RETURN_LIMIT = 100;

router.get("/", async function(req,res){
    // self note, the database name for tierlists is wrong, and it's actually called tierlist.
    // this needs to be fixed sometime.
    // (TODO)

    try {
        let dbRes = await dbCore.FancyDBQuery(
            "tierlist",
            req.query,
            true,
            RETURN_LIMIT
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
const tierlistdataRouter = require("./tierlistdata/tierlistdata.js");
router.use("/tierlistdata", tierlistdataRouter);

module.exports = router;