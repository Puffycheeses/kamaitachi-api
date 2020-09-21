const express = require("express");
const dbHelpers = require("../../../core/db-core.js");
const router = express.Router({mergeParams: true});
const db = require("../../../db.js");
const config = require("../../../config/config.js");
const apiConfig = require("../../../apiconfig.js");
const folderCore = require("../../../core/folder-core.js");

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

router.get("/default-folders", async function(req,res){
    if (!req.query.game || !config.supportedGames.includes(req.query.game)){
        return res.status(400).json({
            success: false,
            description: "No valid game given."
        });
    }

    userID = req.apikey.assignedTo;

    if (parseInt(req.query.userID)){
        let u = await db.get("users").findOne({
            id: parseInt(req.query.userID)
        }, {
            fields: apiConfig.REMOVE_PRIVATE_USER_RETURNS
        });

        if (u){
            userID = u.id;
        }
        else {
            return res.status(404).json({
                success: false,
                description: "This user does not exist."
            });
        }
    }

    let game = req.query.game;

    let playtype = config.validPlaytypes[game].includes(req.query.playtype) || config.defaultPlaytype[game];

    // we are going to make a COOL caching optimisation here
    let dataCache = await db.get("defaultfolder-cache").findOne({
        game: game,
        playtype: playtype,
        userID: userID,
        validUntil: {$gt: Date.now()}
    });

    if (dataCache){
        return res.status(200).json({
            success: true,
            body: dataCache.body
        });
    }

    let defaultFolders = await db.get("folders").find({
        game: game,
        custom: false
    });

    let stats = {

    }

    let folderProm = [];

    for (const folder of defaultFolders) {
        folderProm.push(folderCore.GetDataFromFolderQuery(folder, playtype, null, true).then(async data => {
            let [scores, uniqueScores, uniqueOnLamp] = await Promise.all([
                db.get("scores").find({
                    userID: userID,
                    chartID: {$in: data.charts.map(e => e.chartID)}
                }),
                db.get("scores").find({
                    userID: userID,
                    chartID: {$in: data.charts.map(e => e.chartID)},
                    isScorePB: true
                }, {
                    sort: {"scoreData.gradeIndex": 1}
                }),
                db.get("scores").find({
                    userID: userID,
                    chartID: {$in: data.charts.map(e => e.chartID)},
                    isLampPB: true
                }, {
                    sort: {"scoreData.lampIndex": 1}
                })
            ]);

            if (!stats[folder.folderID]){
                stats[folder.folderID] = {};
            }

            let gradeDist = {};
            let lampDist = {};
            for (const sc of uniqueScores) {
                if (gradeDist[sc.scoreData.grade]){
                    gradeDist[sc.scoreData.grade] += 1;
                }
                else {
                    gradeDist[sc.scoreData.grade] = 1;
                }
            }
            for (const sc of uniqueOnLamp) {
                if (lampDist[sc.scoreData.lamp]){
                    lampDist[sc.scoreData.lamp] += 1;
                }
                else {
                    lampDist[sc.scoreData.lamp] = 1;
                }
            }

            stats[folder.folderID][playtype] = {
                allScores: scores.length,
                uniqueScores: uniqueScores.length,
                totalCharts: data.charts.length,
                lampDist: lampDist,
                gradeDist: gradeDist
            }
            
            if (uniqueScores.length === data.charts.length && uniqueScores.length + data.charts.length !== 0){
                stats[folder.folderID][playtype].gradeFolderLamp = uniqueScores[0].scoreData.grade;
                stats[folder.folderID][playtype].lampFolderLamp = uniqueOnLamp[0].scoreData.lamp;
            }
        }));
    }

    await Promise.all(folderProm);

    await db.get("defaultfolder-cache").insert({
        game: game,
        playtype: playtype,
        userID: userID,
        body: {
            folders: defaultFolders,
            stats: stats
        },
        validUntil: Date.now() + 8.64e+7 // 24 hours
    });

    return res.status(200).json({
        success: true,
        body: {
            folders: defaultFolders,
            stats: stats
        }
    });
})

// mounts
const folderIDRouter = require("./folderID/folderID.js");

router.use("/:folderID", folderIDRouter);

module.exports = router;