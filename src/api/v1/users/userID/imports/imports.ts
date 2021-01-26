import * as express from "express";
const dbCore = require("../../../../../core/db-core.js");
const router = express.Router({ mergeParams: true });
const userHelpers = require("../../../../../core/user-core.js");
const db = require("../../../../../db.js");

// mounted on /api/v1/users/:userID/imports

const MAX_RETURNS = 100;
router.get("/", async function (req, res) {
    let user = req.requestedUser;

    req.query.userID = `${user.id}`;

    try {
        let dbRes = await dbCore.FancyDBQuery("imports", req.query, true, MAX_RETURNS);

        return res.status(dbRes.statusCode).json(dbRes.body);
    } catch (r) {
        if (r.statusCode && r.body) {
            return res.status(r.statusCode).json(r.body);
        } else {
            console.error(req.originalUrl);
            console.error(r);
            return res.status(500).json({
                success: false,
                description: "An unknown internal server error has occured.",
            });
        }
    }
});

module.exports = router;
