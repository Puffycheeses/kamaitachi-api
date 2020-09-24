const express = require("express");
const router = express.Router({mergeParams: true});
const userHelpers = require("../../../../../core/user-core.js");
const middlewares = require("../../../../../middlewares.js");
const dbCore = require("../../../../../core/db-core.js");

// mounted on /api/v1/users/:userID/notifications
router.use(middlewares.RequireUserKeyMatch);

const MAX_RETURNS = 100;

router.get("/", async function(req,res){
    let user = req.user;

    req.query.toUserID = "" + user.id;

    try {
        let dbRes = await dbCore.FancyDBQuery(
            "notifications",
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

// sugar for notifications?read=false
router.get("/unread", async function(req,res){
    let user = req.user;

    req.query.toUserID = "" + user.id;
    req.query.read = "false";

    try {
        let dbRes = await dbCore.FancyDBQuery(
            "notifications",
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