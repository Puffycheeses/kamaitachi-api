const express = require("express");
const dbHelpers = require("../../../../../core/db-core.js");
const router = express.Router({mergeParams: true});
const userHelpers = require("../../../../../core/user-core.js");
const db = require("../../../../../db.js");

// mounted on /api/v1/users/:userID/imports

const MAX_RETURNS = 100;
router.get("/", async function(req,res){
    let user = req.user;

    req.query.userID = "" + user.id;

    let dbRes = await dbHelpers.FancyDBQuery(
        "imports",
        req.query,
        true,
        MAX_RETURNS
    );

    return res.status(dbRes.statusCode).json(dbRes.body);
});

module.exports = router;