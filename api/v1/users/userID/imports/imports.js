const express = require("express");
const dbHelpers = require("../../../../../helpers/dbhelpers.js");
const router = express.Router({mergeParams: true});
const userHelpers = require("../../../../../helpers/userhelpers.js");

// mounted on /api/v1/users/:userID/imports

const MAX_RETURNS = 25;
router.get("/", async function(req,res){
    let user = await userHelpers.GetUser(req.params.userID);

    req.query.toUserID = "" + user.id;

    let dbRes = await dbHelpers.FancyDBQuery(
        "imports",
        req.query,
        true,
        MAX_RETURNS
    );

    return res.status(dbRes.statusCode).json(dbRes.body);
});

module.exports = router;