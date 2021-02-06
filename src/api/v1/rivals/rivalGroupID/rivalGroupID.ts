import db from "../../../../db";
import userCore from "../../../../core/user-core";
import * as express from "express";
import folderCore from "../../../../core/folder-core";
const router = express.Router({ mergeParams: true });
import scoreHelpers from "../../../../core/score-core";
import common from "../../../../core/common-core";

/**
 * @namespace /v1/rivals/rival-group/:rivalGroupID
 */

async function CheckRivalGroupExists(
    req: KTRequest,
    res: express.Response,
    next: express.NextFunction
) {
    let rg = await db.get("rivals").findOne({ rivalGroupID: req.params.rivalGroupID });

    if (!rg) {
        return res.status(400).json({
            success: false,
            description: "This rivalGroupID does not exist.",
        });
    }

    // hook this onto req and pull it out after using this middleware
    req.rivalGroup = rg;

    next();
}

/**
 * @name GET /v1/rivals/rival-group/:rivalGroupID
 */
router.get("/", CheckRivalGroupExists, async (req, res) => {
    let rg = req.rivalGroup as RivalGroupDocument;

    return res.status(200).json({
        success: true,
        description: `Found rival group ${rg.name}.`,
        body: rg,
    });
});

async function ValidateRivalGroupModification(
    req: KTRequest,
    res: express.Response,
    next: express.NextFunction
) {
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

    let requestingUser = req.user;

    if (!requestingUser) {
        return res.status(401).json({
            success: false,
            description: "This is not your group to edit.",
        });
    }

    if (requestingUser.id !== rivalGroup.founderID) {
        return res.status(401).json({
            success: false,
            description: "This is not your group to edit.",
        });
    }

    req.rivalGroup = rivalGroup;

    next();
}

/**
 * Deletes the requested group.
 * @name DELETE /v1/rivals/rival-group/:rivalGroupID
 */
router.delete("/", ValidateRivalGroupModification, async (req, res) => {
    let rg = req.rivalGroup as RivalGroupDocument;

    await db.get("rivals").remove({ _id: rg._id });

    return res.status(200).json({
        success: true,
        description: "Successfully deleted group.",
        body: rg,
    });
});

/**
 * Modifies the requested group.
 * @name PATCH /v1/rivals/rival-group/:rivalGroupID
 * @param name
 * @param desc
 * @param boundary - Overrides the boundary for the rivalGroup, affects how
 * scores are retrieved
 */
router.patch("/", ValidateRivalGroupModification, async (req, res) => {
    let rg = req.rivalGroup as RivalGroupDocument;

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
        if (req.body.desc.length > 240) {
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
        if (cS !== "grade" && cS !== "lamp") {
            return res.status(400).json({
                success: false,
                description: "cellShading must be either 'lamp' or 'grade'.",
            });
        }
        rg.settings.cellShading = cS;
    }

    if (req.body.scoreCompareMode) {
        let scMode = req.body.scoreCompareMode;
        if (scMode !== "folder" && scMode !== "relevant") {
            return res.status(400).json({
                success: false,
                description: "Default score comparison must be folder or relevant.",
            });
        }

        rg.settings.scoreCompareMode = scMode;
    }

    if (rg.settings.scoreCompareMode === "folder") {
        if (req.body.scoreCompareFolderID) {
            let folder = await db.get("folders").findOne({
                game: rg.game,
                folderID: req.body.scoreCompareFolderID,
            });

            if (!folder) {
                return res.status(404).json({
                    success: false,
                    description: `Folder ${req.body.scoreCompareFolderID} does not exist.`,
                });
            }

            rg.settings.scoreCompareFolderID = folder.folderID;
        }
    }

    await db.get("rivals").update({ _id: rg._id }, { $set: rg });

    return res.status(200).json({
        success: true,
        description: "Successfully modified group.",
        body: rg,
    });
});

/**
 * Adds a user to the rival group.
 * @name POST /v1/rivals/rival-group/:rivalGroupID/add-member
 */
router.post("/add-member", ValidateRivalGroupModification, async (req, res) => {
    if (!req.body.userID) {
        return res.status(400).json({
            success: false,
            description: "Please provide an addUserID",
        });
    }

    let rivalGroup = req.rivalGroup as RivalGroupDocument;

    if (rivalGroup.members.length >= 6) {
        return res.status(400).json({
            success: false,
            description: "You cannot have more than 6 rivals in one group.",
        });
    }

    let addingUser = await userCore.GetUser(req.body.userID);

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
        description: `Successfully added ${addingUser.displayname} to rivalgroup ${rivalGroup.name}`,
        body: {
            newMemberList: rivalGroup.members,
        },
    });
});

/**
 * Removes a user from the rival group.
 * @name POST /v1/rivals/rival-group/:rivalGroupID/members
 */
router.post("/remove-member", ValidateRivalGroupModification, async (req, res) => {
    if (!req.body.userID) {
        return res.status(400).json({
            success: false,
            description: "Please provide an removeUserID",
        });
    }

    let rivalGroup = req.rivalGroup as RivalGroupDocument;

    let removingUser = await userCore.GetUser(req.body.userID);

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

    // why does ts think that this is null??????
    rivalGroup.members = rivalGroup.members.filter((e) => e !== removingUser!.id);

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

/**
 * Retrieves the user documents for the members inside the rival group.
 * @name GET /v1/rivals/rival-group/:rivalGroupID/members
 */
router.get("/members", CheckRivalGroupExists, async (req, res) => {
    let rg = req.rivalGroup as RivalGroupDocument;

    let members = await userCore.GetUsers(rg.members);

    return res.status(200).json({
        success: true,
        description: `Found ${members.length} members in ${rg.name}`,
        body: {
            members,
        },
    });
});

/**
 * Retrieves scores from the rival group on the given folderID.
 * @name GET /v1/rivals/rival-group/:rivalGroupID/folder-scores
 * @param folderID - The ID of the folder to pull scores from.
 */
router.get("/folder-scores", CheckRivalGroupExists, async (req: KTRequest, res) => {
    let rg = req.rivalGroup as RivalGroupDocument;

    if (!req.query.folderID) {
        return res.status(400).json({
            success: false,
            description: "No folderID provided.",
        });
    }

    let folder = await db.get("folders").findOne({
        folderID: req.query.folderID,
    });

    let { charts, songs } = await folderCore.GetDataFromFolderQuery(folder, rg.playtype, null);

    if (charts.length === 0) {
        return res.status(400).json({
            success: false,
            description: "This folder has no charts.",
        });
    }

    let scores = (await db.get("scores").find({
        userID: { $in: rg.members },
        chartID: { $in: charts.map((e) => e.chartID) },
    })) as ScoreDocument[];

    if (req.query.autoCoerce !== "false") {
        scores = await scoreHelpers.AutoCoerce(scores);
    }

    let members = await userCore.GetUsers(rg.members);

    return res.status(200).json({
        success: true,
        description: `Successfully found ${scores.length} scores.`,
        body: {
            scores,
            charts,
            songs,
            members,
        },
    });
});

/**
 * Returns a feed of scores determined to be impressive for the group.
 * @name GET /v1/rivals/:rivalGroupID/score-feed
 */
router.get("/score-feed", CheckRivalGroupExists, async (req, res) => {
    let rg = req.rivalGroup as RivalGroupDocument;

    if (!req.query.includeFounder) {
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

    let members = await userCore.GetUsers(rg.members);
    let impressiveness = parseFloat(req.query.impressiveness) || 0.95;
    let lim = common.AssertPositiveInteger(req.query.limit, 100, true);
    let start = common.AssertPositiveInteger(req.query.start, 0);

    // can be optimised by using rival group average then going from there?
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
            skip: start,
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
        chartID: { $in: importantScores.map((e) => e.chartID) },
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

/**
 * Retrieves "relevant" scores from the rival group.
 * @name GET /v1/rivals/rival-group/:rivalGroupID/relevant-scores
 * @param boundary - Between 0 and 0.2, determines how lenient to be with relevancy.
 * @param autoCoerce - if exactly "false", scores will NOT be auto-coerced.
 */
router.get("/relevant-scores", CheckRivalGroupExists, async (req, res) => {
    let rg = req.rivalGroup as RivalGroupDocument;

    let members = await userCore.GetUsers(rg.members);

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

    let avgRating =
        members.reduce((a, b) => a + (b.ratings[rg.game][rg.playtype] || 0), 0) / members.length;

    let lowerBound = avgRating * (1 - boundary);

    let scores = (await db.get("scores").find({
        userID: { $in: rg.members },
        "calculatedData.rating": { $gt: lowerBound },
        game: rg.game,
        "scoreData.playtype": rg.playtype,
        isScorePB: true,
    })) as ScoreDocument[];

    if (scores.length === 0) {
        return res.status(400).json({
            success: false,
            description: "There are no relevant scores to this group.",
        });
    }

    // this is now fast - zkldi
    // scorePBs dont necessarily have the lamp PB. for cases where this is not true,
    // we need to find the scores associated lampPB and monkey patch it on.

    if (req.query.autoCoerce !== "false") {
        scores = await scoreHelpers.AutoCoerce(scores);
    }

    let charts = await db.get(`charts-${rg.game}`).find({
        chartID: { $in: scores.map((e) => e.chartID) },
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
