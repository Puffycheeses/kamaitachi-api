const express = require("express");
const router = express.Router({mergeParams: true});
const dbHelpers = require("../../../../../core/db-core.js");;

// mounted on /api/v1/games/:game/songs

const MAX_RETURNS = 100;

router.get("/", async function(req,res){

    try {
        let dbRes = await dbHelpers.FancyDBQuery(
            "songs-" + req.params.game,
            req.query,
            true,
            MAX_RETURNS,
            "songs"
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
const songIDRouter = require("./songID/songID.js");

router.use("/:songID", songIDRouter);

module.exports = router;