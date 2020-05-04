const express = require("express");
const router = express.Router({mergeParams: true});
const config = require("../../../../../config/config.js");
const middlewares = require("../../../../../middlewares.js");

// mounted on /api/v1/games/:game/folders/:folderType

router.use(middlewares.RequireValidFolderType);

router.get("/", async function(req,res){
    let folders = config.folders[req.params.game][req.params.folderType]
    return res.status(200).json({
        success: true,
        description: req.params.game + " has " + folders.length + " folders in folderType " + req.params.folderType,
        body: {
            gameFolderMode: config.folders[req.params.game].type,
            items: folders
        }
    });
});

// mounts
const folderRouter = require("./folderName/folder.js");
router.use("/:folderName", folderRouter);

module.exports = router;