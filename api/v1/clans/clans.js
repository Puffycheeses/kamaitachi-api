const express = require("express");
const router = express.Router({mergeParams: true});
const dbHelpers = require("../../../core/db-core.js");

// mounted on /api/v1/clans

router.get("/", async function(req,res){
    let dbRes = await dbHelpers.FancyDBQuery(
        "clans",
        req.query,
        true
    );

    return res.status(dbRes.statusCode).json(dbRes.body);
});

// mounts
const clanRouter = require("./clanID/clanID.js");

router.use("/:clanID", clanRouter);

module.exports = router;