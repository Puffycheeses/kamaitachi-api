import * as express from "express";
const router = express.Router({ mergeParams: true });
import db from "../../../../db";

// mounted on /api/v1/sessions/:sessionID

async function GetSessionWithID(req, res, next) {
    let sessionObj = await db.get("sessions").findOne({
        sessionID: req.params.sessionID,
    });

    if (!sessionObj) {
        return res.status(400).json({
            success: false,
            description: `session with ID ${req.params.sessionID} could not be found.`,
        });
    }

    req.sessionObj = sessionObj;
    next();
}

router.get("/", GetSessionWithID, async (req, res) => {
    let sessionObj = req.sessionObj;

    return res.status(200).json({
        success: true,
        description: "Found session successfully.",
        body: sessionObj,
    });
});

router.get("/scores", GetSessionWithID, async (req, res) => {
    let sessionObj = req.sessionObj;

    let start = parseInt(req.query.start) || 0;

    let limit = parseInt(req.query.limit) || 500;

    if (limit > 500) {
        limit = 500;
    }

    let scoreIDs = sessionObj.scores.map((e) => e.scoreID).slice(start, start + limit);

    let scores = await db.get("scores").find({
        scoreID: { $in: scoreIDs },
    });

    if (req.query.getAssocData) {
        let songs = await db.get(`songs-${sessionObj.game}`).find({
            id: { $in: scores.map((e) => e.songID) },
        });

        let charts = [];
        if (scores.length !== 0) {
            charts = await db.get(`charts-${sessionObj.game}`).find({
                chartID: { $in: scores.map((e) => e.chartID) },
            });
        }

        let retBody = {
            songs,
            charts,
            scores,
            session: sessionObj,
        };

        if (start + limit < sessionObj.scores.length) {
            retBody.nextStartPoint = start + limit;
        }

        return res.status(200).json({
            success: true,
            description: `Found ${scores.length} scores.`,
            body: retBody,
        });
    } else {
        let retBody = {
            scores,
            session: sessionObj,
        };

        if (start + limit < sessionObj.scores.length) {
            retBody.nextStartPoint = start + limit;
        }

        return res.status(200).json({
            success: true,
            description: `Found ${scores.length} scores.`,
            body: retBody,
        });
    }
});

// gets the parenting folders of a sessions' played charts.
router.get("/folders", GetSessionWithID, async (req, res) => {
    let ses = req.sessionObj;
    let scoreIDs = ses.scores.map((e) => e.scoreID);
    let scores = await db.get("scores").find({
        scoreID: { $in: scoreIDs },
    });

    let parentFolders = await db.get("chart-folder-lookup").aggregate([
        {
            $match: {
                chartID: { $in: scores.map((e) => e.chartID) },
            },
        },
        {
            $group: {
                _id: "$folderID",
                chartIDs: { $push: "$chartID" },
            },
        },
    ]);

    let folderData = await db.get("folders").find({
        folderID: { $in: parentFolders.map((e) => e._id) },
    });

    return res.status(200).json({
        success: true,
        description: "Successfully found parent folders for session.",
        body: {
            folderData: folderData,
            parentFolders: parentFolders,
            sessionObj: ses,
        },
    });
});

// options stuff

async function ValidateUser(req, res, next) {
    if (!req.user || req.user.id !== req.sessionObj.userID) {
        return res.status(401).json({
            success: false,
            description: "Unauthorised.",
        });
    }
    next();
}

router.patch("/set-name", GetSessionWithID, ValidateUser, async (req, res) => {
    if (!req.body.name) {
        return res.status(400).json({
            success: false,
            description: "No name provided.",
        });
    }
    if (req.body.name.length > 140) {
        return res.status(400).json({
            success: false,
            description: "Session names cannot be longer than 140 characters.",
        });
    }

    let session = req.sessionObj;

    await db.get("sessions").update({ _id: session._id }, { $set: { name: req.body.name } });

    return res.status(200).json({
        success: true,
        description: `Successfully changed session name from ${session.name} to ${req.body.name}.`,
        body: {
            oldName: session.name,
            newName: req.body.name,
        },
    });
});

router.patch("/set-desc", GetSessionWithID, ValidateUser, async (req, res) => {
    if (!req.body.desc) {
        return res.status(400).json({
            success: false,
            description: "No desc provided.",
        });
    }
    if (req.body.desc.length > 280) {
        return res.status(400).json({
            success: false,
            description: "Session descs cannot be longer than 280 characters.",
        });
    }

    let session = req.sessionObj;

    await db.get("sessions").update({ _id: session._id }, { $set: { desc: req.body.desc } });

    return res.status(200).json({
        success: true,
        description: `Successfully changed session desc from ${session.desc} to ${req.body.desc}.`,
        body: {
            oldDesc: session.desc,
            newDesc: req.body.desc,
        },
    });
});

router.patch("/toggle-highlight", GetSessionWithID, ValidateUser, async (req, res) => {
    await db
        .get("sessions")
        .update({ _id: req.sessionObj._id }, { $set: { highlight: !req.sessionObj.highlight } });

    return res.status(200).json({
        success: true,
        description: `Successfully ${
            req.sessionObj.highlight ? "unhighlighted session." : "highlighted session!"
        }`,
        body: {
            highlightStatus: !req.sessionObj.highlight,
        },
    });
});

export default router;
