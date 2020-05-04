const express = require("express");
const router = express.Router({mergeParams: true});
const dbHelpers = require("../../../helpers/dbhelpers.js");

// mounted on /api/v1/tierlists

const RETURN_LIMIT = 100;

router.get("/", async function(req,res){
    // self note, the database name for tierlists is wrong, and it's actually called tierlist.
    // this needs to be fixed sometime.
    // (TODO)

    let dbRes = await dbHelpers.FancyDBQuery(
        "tierlist",
        req.query,
        true,
        RETURN_LIMIT
    );

    return res.status(dbRes.statusCode).json(dbRes.body);
});

// mounts
const tierlistdataRouter = require("./tierlistdata/tierlistdata.js");
router.use("/tierlistdata", tierlistdataRouter);

module.exports = router;