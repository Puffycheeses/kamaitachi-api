const express = require("express");
const router = express.Router({mergeParams: true});
const config = require("../../../../../config/config.js");
const db = require("../../../../../db.js");

// mounted on /api/v1/users/:userID/ranking

router.get("/", async function(req,res){
    let user = req.user;

    let game = req.query.game;

    if (!config.supportedGames.includes(game)){
        return res.status(400).json({
            success: false,
            description: "Invalid or no game provided."
        });
    }
    
    let playtype = req.query.playtype;

    if (!config.validPlaytypes[game].includes(playtype)){
        return res.status(400).json({
            success: false,
            description: "Invalid or no playtype provided."
        });
    }


    if (user.ratings[game][playtype]){
        let ranking = await db.get("users").count({["ratings." + game + "." + playtype]: {$gte: user.ratings[game][playtype]}});
        return res.status(200).json({
            success: true,
            description: "Found users ranking.",
            body: { 
                ranking: ranking
            }
        });
    }
    else {
        return res.status(400).json({
            success: false,
            description: "Could not find ranking for user (has user played this game?)."
        });
    }


});

module.exports = router;