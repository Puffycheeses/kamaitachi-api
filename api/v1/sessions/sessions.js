const express = require("express");
const dbCore = require("../../../core/db-core.js");
const sessionCore = require("../../../core/session-core.js");
const router = express.Router({mergeParams: true});
const db = require("../../../db.js");
const apiConfig = require("../../../apiconfig.js");

// mounted on /api/v1/sessions

const MAX_RETURNS = 100;
router.get("/", async function(req,res){
    try {
        let queryObj = {};

        queryObj = await sessionCore.HandleCustomUserSelections(req, queryObj);

        let dbRes = await dbCore.FancyDBQuery(
            "sessions",
            req.query,
            true,
            MAX_RETURNS,
            null,
            false,
            queryObj
        );

        if (dbRes.body.success){
            if (req.query.getAssocData === "true"){
                dbRes.body.body.users = await db.get("users").find({
                    id: {$in: dbRes.body.body.items.map(e => e.userID)}
                }, {
                    projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS
                });
            }
        }
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


router.use("/:sessionID", require("./sessionID/sessionID.js"));

module.exports = router;