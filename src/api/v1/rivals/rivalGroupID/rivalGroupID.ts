import db from "../../../../db";
import userHelpers from "../../../../core/user-core";
import * as express from "express";
import config from "../../../../config/config";
const router = express.Router({ mergeParams: true });
import scoreHelpers from "../../../../core/score-core";

// mounted on /api/v1/rivals/:rivalGroupID

async function CheckRivalGroupExists(req, res, next) {
    let rg = await db.get("rivals").findOne({ rivalGroupID: req.params.rivalGroupID });

    if (!rg) {
        return res.status(400).json({
            success: false,
            description: "This rivalGroupID does not exist.",
        });
    }

    // hook this onto req and pull it out after using this middleware
    req.rg = rg;

    next();
}

router.get("/", CheckRivalGroupExists, async function (req, res) {
    let rg = req.rg;

    return res.status(200).json({
        success: true,
        description: `Found rival group ${rg.name}.`,
        body: rg,
    });
});

async function ValidateRivalGroupModification(req, res, next) {
    // check ID even given
    if (!req.params.rivalGroupID) {
        return res.status(400).json({
            success: false,
            description: "Please provide a rivalGroupID",
        });
    }

    // check group exists
    let rivalGroup = await db.get("rivals").findOne({ rivalGroupID: req.params.rivalGroupID });

    if (!rivalGroup) {
        return res.status(400).json({
            success: false,
            description: "This rival group does not exist.",
        });
    }

    // check user is owner of group
    let apiKey = req.body.key ? req.body.key : req.cookies.apikey;

    let requestingUser = await userHelpers.GetUserWithAPIKey(apiKey);

    if (!requestingUser) {
        return res.status(500).json({
            success: false,
            description:
                "Fatal error in grabbing your profile. This has been reported, but please ping me about this.",
        });
    }

    if (requestingUser.id !== rivalGroup.founderID) {
        return res.status(401).json({
            success: false,
            description: "This is not your group to edit.",
        });
    }

    req.rg = rivalGroup;

    next();
}

router.delete("/delete-group", ValidateRivalGroupModification, async function (req, res) {
    let rg = req.rg;

    await db.get("rivals").remove({ _id: rg._id });

    return res.status(200).json({
        success: true,
        description: "Successfully deleted group.",
    });
});

router.patch("/modify-group", ValidateRivalGroupModification, async function (req, res) {
    let rg = req.rg;

    if (req.body.name) {
        if (req.body.name.length > 40) {
            return res.status(400).json({
                success: false,
                description: "Group names must be less than 40 characters.",
            });
        }
        rg.name = req.body.name;
    }

    if (req.body.desc) {
        if (req.body.desc.length > 200) {
            return res.status(400).json({
                success: false,
                description: "Group descriptions must be less than 200 characters.",
            });
        }
        rg.desc = req.body.desc;
    }

    if (req.body.default) {
        rg.isDefault = !(req.body.default === "false");
    }

    // settings

    if (req.body.boundary) {
        let floatBoundary = parseFloat(req.body.boundary);
        if (floatBoundary < 0.2 && floatBoundary >= 0) {
            rg.settings.boundary = floatBoundary;
        } else {
            return res.status(400).json({
                success: false,
                description: "Invalid boundary. Boundary cannot be greater than 0.2 or negative.",
            });
        }
    }

    if (req.body.strictness) {
        let floatStrict = parseFloat(req.body.strictness);

        if (floatStrict <= 1 && floatStrict > 0) {
            rg.settings.strictness = floatStrict;
        } else {
            return res.status(400).json({
                success: false,
                description: "Invalid strictess. Must be between 0 and 1.",
            });
        }
    }

    if (req.body.cellShading) {
        let cS = req.body.cellShading;
        if (!["grade", "lamp"].includes(cS)) {
            return res.status(400).json({
                success: false,
                description: "cellShading must be either 'lamp' or 'grade'.",
            });
        }
        rg.settings.cellShading = cS;
    }

    if (req.body.scoreCompareMode) {
        let scMode = req.body.scoreCompareMode;
        if (!["folder", "relevant"].includes(scMode)) {
            return res.status(400).json({
                success: false,
                description: "Default score comparison must be folder or relevant.",
            });
        }

        rg.settings.scoreCompareMode = scMode;
    }

    if (rg.settings.scoreCompareMode === "folder") {
        if (req.body.scoreCompareFType) {
            let fType = req.body.scoreCompareFType;

            if (!["versions", "levels"].includes(fType)) {
                return res.status(400).json({
                    success: false,
                    description: "Folder Type must be levels or versions.",
                });
            }

            rg.settings.scoreCompareFType = fType;
        }

        if (req.body.scoreCompareFName) {
            let fName = req.body.scoreCompareFName;

            if (!config.folders[rg.game][rg.settings.scoreCompareFType].includes(fName)) {
                return res.status(400).json({
                    success: false,
                    description: "Folder name must be a valid folder for the respective game.",
                });
            }

            rg.settings.scoreCompareFName = fName;
        }
    }

    await db.get("rivals").update({ _id: rg._id }, { $set: rg });

    return res.status(200).json({
        success: true,
        description: "Successfully modified group.",
        body: rg,
    });
});

router.patch("/add-member", ValidateRivalGroupModification, async function (req, res) {
    if (!req.body.addUserID) {
        return res.status(400).json({
            success: false,
            description: "Please provide an addUserID",
        });
    }

    let rivalGroup = req.rg;

    if (rivalGroup.members.length >= 6) {
        return res.status(400).json({
            success: false,
            description: "You cannot have more than 6 rivals in one group.",
        });
    }

    let addingUser = await userHelpers.GetUser(req.body.addUserID);

    if (!addingUser) {
        return res.status(400).json({
            success: false,
            description: "This user does not exist.",
        });
    }

    if (rivalGroup.members.includes(addingUser.id)) {
        return res.status(400).json({
            success: false,
            description: "This user is already in this rival group.",
        });
    }

    if (
        !addingUser.ratings[rivalGroup.game] ||
        !addingUser.ratings[rivalGroup.game][rivalGroup.playtype]
    ) {
        return res.status(400).json({
            success: false,
            description: "This user has not played this game + playtype combination.",
        });
    }

    rivalGroup.members.push(addingUser.id);

    await db
        .get("rivals")
        .update({ _id: rivalGroup._id }, { $set: { members: rivalGroup.members } });

    return res.status(200).json({
        success: true,
        description: `Successfully added ${req.body.addUserID} to rivalgroup ${rivalGroup.name}`,
        body: {
            newMemberList: rivalGroup.members,
        },
    });
});

router.patch("/set-default", ValidateRivalGroupModification, async function (req, res) {
    // todo
    return res.status(404).json({
        success: false,
        description: "unimplemented.",
    });
});

router.patch("/remove-member", ValidateRivalGroupModification, async function (req, res) {
    if (!req.body.removeUserID) {
        return res.status(400).json({
            success: false,
            description: "Please provide an removeUserID",
        });
    }

    let rivalGroup = req.rg;

    let removingUser = await userHelpers.GetUser(req.body.removeUserID);

    if (!removingUser) {
        return res.status(400).json({
            success: false,
            description: "This user does not exist.",
        });
    }

    if (!rivalGroup.members.includes(removingUser.id)) {
        return res.status(400).json({
            success: false,
            description: "This user is not in this rival group.",
        });
    }

    if (rivalGroup.founderID === removingUser.id) {
        return res.status(400).json({
            success: false,
            description: "You cannot remove yourself from a rival group.",
        });
    }

    rivalGroup.members = rivalGroup.members.filter((e) => e !== removingUser.id);

    await db
        .get("rivals")
        .update({ _id: rivalGroup._id }, { $set: { members: rivalGroup.members } });

    return res.status(200).json({
        success: true,
        description: `Successfully removed ${req.body.removeUserID} from rivalgroup ${rivalGroup.name}`,
        body: {
            newMemberList: rivalGroup.members,
        },
    });
});

router.get("/members", CheckRivalGroupExists, async function (req, res) {
    let rg = req.rg;

    let members = await userHelpers.GetUsers(rg.members);

    return res.status(200).json({
        success: true,
        description: `Found ${members.length} members in ${rg.name}`,
        body: {
            members,
        },
    });
});

router.get("/folder-scores", CheckRivalGroupExists, async function (req, res) {
    let rg = req.rg;

    if (req.query.folderType !== "levels" && req.query.folderType !== "versions") {
        return res.status(400).json({
            success: false,
            description: "This folderType is not supported.",
        });
    }

    if (!config.folders[rg.game][req.query.folderType].includes(req.query.folderName)) {
        return res.status(400).json({
            success: false,
            description: "This folderName does not exist in the database.",
        });
    }

    let songs;
    let charts;

    if (req.query.folderType === "levels") {
        charts = await db
            .get(`charts-${rg.game}`)
            .find(
                { level: req.query.folderName, playtype: rg.playtype },
                { projection: { _id: 0 } }
            );

        songs = await db
            .get(`songs-${rg.game}`)
            .find({ id: { $in: charts.map((e) => e.id) } }, { projection: { _id: 0 } });
    } else {
        songs = await db
            .get(`songs-${rg.game}`)
            .find({ firstAppearance: req.query.folderName }, { projection: { _id: 0 } });

        charts = await db
            .get(`charts-${rg.game}`)
            .find(
                { id: { $in: songs.map((e) => e.id) }, playtype: rg.playtype },
                { projection: { _id: 0 } }
            );
    }

    if (charts.length === 0) {
        return res.status(400).json({
            success: false,
            description: "This folder has no charts.",
        });
    }

    let scores = await db.get("scores").find({
        $or: charts.map((c) => ({
            userID: { $in: rg.members },
            songID: c.id,
            "scoreData.difficulty": c.difficulty,
            "scoreData.playtype": rg.playtype,
            game: rg.game,
            isScorePB: true,
        })),
    });

    if (req.query.autocoerce !== "false") {
        scores = await scoreHelpers.AutoCoerce(scores);
    }

    let members = await userHelpers.GetUsers(rg.members);

    return res.status(200).json({
        success: true,
        description: `Successfully found ${scores.length} scores.`,
        body: {
            scores,
            charts,
            songs,
            members,
            rivalGroup: rg,
        },
    });
});

router.get("/score-feed", CheckRivalGroupExists, async function (req, res) {
    let rg = req.rg;

    if (!req.query.includeSelf) {
        rg.members = rg.members.filter((e) => e !== rg.founderID);
    }

    if (rg.members.length === 0) {
        return res.status(200).json({
            success: true,
            description: "No other members in rival group!",
            body: {
                scores: [],
                charts: [],
                songs: [],
                members: [],
            },
        });
    }

    let members = await userHelpers.GetUsers(rg.members);
    let impressiveness = parseFloat(req.query.impressiveness) || 0.95;
    let lim = parseInt(req.query.limit) < 100 ? parseInt(req.query.limit) : 100;
    let start = parseInt(req.query.start) || 0;

    let importantScores = await db.get("scores").find(
        {
            game: rg.game,
            "scoreData.playtype": rg.playtype,
            isScorePB: true,
            timeAchieved: { $gt: 0 },
            $or: members.map((m) => ({
                userID: m.id,
                "calculatedData.rating": { $gte: m.ratings[rg.game][rg.playtype] * impressiveness },
            })),
        },
        {
            sort: { timeAchieved: -1 },
            projection: { _id: 0 },
            start: start,
            limit: lim,
        }
    );

    if (importantScores.length === 0) {
        return res.status(200).json({
            success: true, // maybe?
            description: "Found no scores.",
            body: {
                scores: importantScores,
                charts: [],
                songs: [],
                members: members,
            },
        });
    }

    let songsArr = await db.get(`songs-${rg.game}`).find({
        id: { $in: importantScores.map((e) => e.songID) },
    });

    let chartsArr = await db.get(`charts-${rg.game}`).find({
        $or: importantScores.map((e) => ({
            id: e.songID,
            difficulty: e.scoreData.difficulty,
            playtype: e.scoreData.playtype,
        })),
    });

    return res.status(200).json({
        success: true,
        description: `Found ${importantScores.length} scores.`,
        body: {
            scores: importantScores,
            songs: songsArr,
            charts: chartsArr,
            members: members,
        },
    });
});

router.get("/relevant-scores", CheckRivalGroupExists, async function (req, res) {
    let rg = req.rg;

    let members = await userHelpers.GetUsers(rg.members);

    let boundary = rg.settings.boundary;

    if (req.query.boundary) {
        let floatBound = parseFloat(req.query.boundary);
        if (floatBound > 0.2 || floatBound < 0) {
            return res.status(400).json({
                success: false,
                description: "Boundary must be between 0 and 0.2",
            });
        }
        boundary = floatBound;
    }

    // sort members in rating order so we know what bounds to go for
    let avgRating =
        members.reduce((a, b) => a + (b.ratings[rg.game][rg.playtype] || 0), 0) / members.length;

    let lowerBound = avgRating * (1 - boundary);

    let scores = await db.get("scores").find({
        userID: { $in: rg.members },
        "calculatedData.rating": { $gt: lowerBound },
        game: rg.game,
        "scoreData.playtype": rg.playtype,
        isScorePB: true,
    });

    if (scores.length === 0) {
        return res.status(400).json({
            success: false,
            description: "There are no relevant scores to this group.",
        });
    }

    // this is now fast - zkldi
    // scorePBs dont necessarily have the lamp PB. for cases where this is not true,
    // we need to find the scores associated lampPB and monkey patch it on.

    if (req.query.autocoerce !== "false") {
        scores = await scoreHelpers.AutoCoerce(scores);
    }

    let charts = await db.get(`charts-${rg.game}`).find({
        $or: scores.map((s) => ({
            id: s.songID,
            difficulty: s.scoreData.difficulty,
            playtype: s.scoreData.playtype,
        })),
    });

    let songs = await db.get(`songs-${rg.game}`).find({
        id: { $in: charts.map((e) => e.id) },
    });

    return res.status(200).json({
        success: true,
        description: `Successfully found ${scores.length} scores.`,
        body: {
            scores,
            charts,
            songs,
            members,
            rivalGroup: rg,
        },
    });
});

export default router;
