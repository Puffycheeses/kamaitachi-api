const express = require("express");
const dbHelpers = require("../../../core/db-core.js");
const router = express.Router({mergeParams: true});
const db = require("../../../db.js");

// mounted on /api/v1/folders

const MAX_RETURNS = 100;
router.get("/", async function(req,res){
    try {
        let dbRes = await dbHelpers.FancyDBQuery(
            "folders",
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

// mounts
const folderIDRouter = require("./folderID/folderID.js");

router.use("/:folderID", folderIDRouter);

module.exports = router;