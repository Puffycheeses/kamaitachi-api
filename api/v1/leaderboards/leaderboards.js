const db = require("../../../db.js");
const express = require("express");
const router = express.Router({mergeParams: true});
const rgxIsInt = /^[0-9]+$/;
const config = require("../../../config/config.js");
const apiConfig = require("../../../apiconfig.js");

// mounted on /api/v1/leaderboards

const RETURN_LIMIT = 100;
router.get("/games/:game", async function(req,res){

    let playtype = req.query.playtype ? req.query.playtype : config.defaultPlaytype[req.params.game];

    let settings = {
        fields: apiConfig.REMOVE_PRIVATE_USER_RETURNS,
        sort: {["ratings." + req.params.game + ". " + playtype]: -1}
    }
    
    settings.skip = req.query.start ? parseInt(req.query.start) : 0
    settings.limit = RETURN_LIMIT;
    if (req.query.limit && !req.query.limit.match(rgxIsInt)){
        return res.status(400).json({
            success: false,
            description: "Limit is not an integer."
        });
    }
    if (parseInt(req.query.limit) > settings.limit){
        return res.status(400).json({
            success: false,
            description: "Limit exceeds " + settings.limit + "."
        });
    }
    settings.limit = parseInt(req.query.limit);

    let users = await db.get("users").find({},settings);

    let leaderBody = {items: users};
    if (users.length !== 0){
        leaderBody.nextStartPoint = settings.skip + settings.limit;
    }

    return res.status(200).json({
        success: true,
        description: "Leaderboards successfully returned",
        body: leaderBody
    })
});

module.exports = router;