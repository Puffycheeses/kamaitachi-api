const db = require("../../../db.js");
const express = require("express");
const router = express.Router({mergeParams: true});
const userHelpers = require("../../../helpers/userhelpers.js");
const rgxIsInt = /^[0-9]+$/;

// mounted on /api/v1/leaderboards

const RETURN_LIMIT = 100;
router.get("/games/:game", async function(req,res){

    let playtype = req.query.playtype ? req.query.playtype : config.defaultPlaytype[req.params.game];

    let settings = {
        fields: {_id: 0},
        sort: ratings[req.params.game][playtype]
    }

    settings.skip = query.start ? parseInt(query.start) : 0
    settings.limit = RETURN_LIMIT;
    if (!req.query.limit.match(rgxIsInt)){
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
    settings.limit = parseInt(query.limit);

    let users = await db.get("users").find({},settings);

    let leaderBody = {users};
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