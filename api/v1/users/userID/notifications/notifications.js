const express = require("express");
const router = express.Router({mergeParams: true});
const userHelpers = require("../../../../../helpers/userhelpers.js");
const middlewares = require("../../../../../middlewares.js");
const dbHelpers = require("../../../../../helpers/dbhelpers.js");

// mounted on /api/v1/users/:userID/notifications
router.use(middlewares.RequireUserKeyMatch);

const MAX_RETURNS = 100;

router.get("/", async function(req,res){
    let user = req.user;

    req.query.toUserID = "" + user.id;

    let dbRes = await dbHelpers.FancyDBQuery(
        "notifications",
        req.query,
        true,
        MAX_RETURNS
    );

    return res.status(dbRes.statusCode).json(dbRes.body);
});

// sugar for notifications?read=false
router.get("/unread", async function(req,res){
    let user = req.user;

    req.query.toUserID = "" + user.id;
    req.query.read = "false";

    let dbRes = await dbHelpers.FancyDBQuery(
        "notifications",
        req.query,
        true,
        MAX_RETURNS
    );

    return res.status(dbRes.statusCode).json(dbRes.body);
});

module.exports = router;