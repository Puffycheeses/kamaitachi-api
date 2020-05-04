const db = require("../../../../../../db.js");
const express = require("express");
const router = express.Router({mergeParams: true});
const middlewares = require("../../../../../../middlewares.js");
const userHelpers = require("../../../../../../helpers/userhelpers.js");
const folderHelpers = require("./folderhelpers.js");
const config = require("../../../../../../config/config.js");

// mounted on /api/v1/games/:game/:folderType/:folderName

router.use(middlewares.RequireExistingFolderName);

router.get("/", async function(req,res){
    let folderBody = await folderHelpers.GetFolderInfo(req.query, req.params);
    if (!folderBody.success){
        return res.status(folderBody.statusCode).json({
            success: false,
            description: folderBody.description
        });
    }
    
    let folderName = req.params.folderType === "levels" ? req.params.folderName : config.versionHuman[req.params.game][req.params.folderName];
    return res.status(200).json({
        success: true,
        description: "This folder contains " + folderBody.folderSongs.length + " songs and subsumes " + folderBody.folderCharts.length + " charts.",
        body:{
            items: {
                songs: folderBody.folderSongs,
                charts: folderBody.folderCharts,
            },
            folderName: folderName,
            folderType: req.params.folderType
        }
    });
});

router.get("/scores", async function(req,res){

    if (!req.query.userID && !req.query.userIDs){
        return res.status(400).json({
            success: false,
            description: "No userID(s) provided."
        });
    }

    if (req.query.userID && req.query.userIDs){
        return res.status(400).json({
            success: false,
            description: "Cannot provide both userID and userIDs."
        })
    }

    let userIDs = req.query.userIDs ? req.query.userIDs.split(",") : [req.query.userID]

    let users = []

    for (const userID of userIDs) {
        let user = await userHelpers.GetUser(req.query.userID);
        if (!user){
            return res.status(404).json({
                success: false,
                description: "The user " + userID + " does not exist."
            });
        }
        users.push(user);
    }



    let folderBody = await folderHelpers.GetFolderInfo(req.query, req.params);
    if (!folderBody.success){
        return res.status(folderBody.statusCode).json({
            success: false,
            description: folderBody.description
        });
    }

    let folderScores = await db.get("scores").find({
        $or: folderBody.folderCharts.map(c => ({
            userID: {$in: users.map(e => e.id)},
            game: req.params.game,
            songID: c.id,
            "scoreData.playtype": c.playtype,
            "scoreData.difficulty": c.difficulty
        })
    )});

    let items = {
        scores: folderScores,
        charts: folderBody.folderCharts,
        songs: folderBody.folderSongs
    }

    if(req.query.userIDs){
        items.users = users;
    }
    else{
        items.user = users[0];
    }

    let folderName = req.params.folderType === "levels" ? req.params.folderName : config.versionHuman[req.params.game][req.params.folderName];

    return res.status(200).json({
        success: true,
        description: "Found " + folderScores.length + " scores in a folder of " + folderBody.folderCharts.length + " charts.",
        body: {
            items: items,
            folderName: folderName,
            folderType: req.params.folderType,
        }
    });
});


module.exports = router;