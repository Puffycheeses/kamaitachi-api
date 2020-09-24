const express = require("express");
const dbCore = require("../../../core/db-core.js");
const router = express.Router({mergeParams: true});
const db = require("../../../db.js");
const apiConfig = require("../../../apiconfig.js");

// mounted on /api/v1/user-goals

const MAX_RETURNS = 100;
router.get("/", async function(req,res){
    try {
        let dbRes = await dbCore.FancyDBQuery(
            "user-goals",
            req.query,
            true,
            MAX_RETURNS
        );

        if (dbRes.body.success){
            if (req.query.getAssocUsers){
                let assocUsers = await db.get("users").find({
                    id: {$in: dbRes.body.body.items.map(e => e.userID)}
                }, {
                    projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS
                });

                dbRes.body.body.users = assocUsers;
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

module.exports = router;