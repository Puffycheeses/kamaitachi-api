import * as express from "express";
const router = express.Router({ mergeParams: true });
import db from "../../../../db";
import common from "../../../../core/common-core";

/**
 * @namespace /v1/sessions/:sessionID
 */

async function GetSessionWithID(req: KTRequest, res: express.Response, next: express.NextFunction) {
    let sessionObj = await db.get("sessions").findOne({
        sessionID: req.params.sessionID,
    });

    if (!sessionObj) {
        return res.status(400).json({
            success: false,
            description: `Session with ID ${req.params.sessionID} could not be found.`,
        });
    }

    req.ktchiSession = sessionObj as SessionDocument;
    next();
}

/**
 * Returns the session at the given ID.
 * @name GET /v1/sessions/:sessionID
 */
router.get("/", GetSessionWithID, async (req, res) =>
    res.status(200).json({
        success: true,
        description: "Found session successfully.",
        body: req.ktchiSession,
    })
);

interface SessionScoresReturn {
    songs?: SongDocument[];
    charts?: ChartDocument[];
    scores: ScoreDocument[];
    session: SessionDocument;
    nextStartPoint?: integer;
}

/**
 * Returns up to 500 scores that are part of the given session.
 * @name GET /v1/sessions/:sessionID/scores
 */
router.get("/scores", GetSessionWithID, async (req, res) => {
    let sessionObj = req.ktchiSession as SessionDocument;

    let start = common.AssertPositiveInteger(req.query.start, 0);

    let limit = common.AssertPositiveInteger(req.query.limit, 500);

    let scoreIDs = sessionObj.scores.map((e) => e.scoreID).slice(start, start + limit);

    let scores = await db.get("scores").find({
        scoreID: { $in: scoreIDs },
    });

    if (req.query.getAssocData === "true") {
        let songs = await db.get(`songs-${sessionObj.game}`).find({
            id: { $in: scores.map((e) => e.songID) },
        });

        let charts: ChartDocument[] = [];
        if (scores.length !== 0) {
            charts = await db.get(`charts-${sessionObj.game}`).find({
                chartID: { $in: scores.map((e) => e.chartID) },
            });
        }

        let retBody: SessionScoresReturn = {
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
        let retBody: SessionScoresReturn = {
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

interface CFLAggregateResult {
    _id: string;
    chartIDs: string[];
}

/**
 * Retrieves the parenting folders of the scores inside a session.
 * @name GET /v1/sessions/:sessionID/folders
 */
router.get("/folders", GetSessionWithID, async (req, res) => {
    let ses = req.ktchiSession as SessionDocument;
    let scoreIDs = ses.scores.map((e) => e.scoreID);
    let scores = await db.get("scores").find({
        scoreID: { $in: scoreIDs },
    });

    let parentFolders = (await db.get("chart-folder-lookup").aggregate([
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
    ])) as CFLAggregateResult[];

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

async function ValidateUser(req: KTRequest, res: express.Response, next: express.NextFunction) {
    if (!req.user || req.user.id !== req.ktchiSession!.userID) {
        return res.status(401).json({
            success: false,
            description: "Unauthorised.",
        });
    }
    next();
}

/**
 * Sets the name of a session.
 * @name POST /v1/sessions/:sessionID/set-name
 * @param name - A 140 character or less string.
 */
router.post("/set-name", GetSessionWithID, ValidateUser, async (req, res) => {
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

    let session = req.ktchiSession as SessionDocument;

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

/**
 * Sets the description of a session.
 * @name POST /v1/sessions/:sessionID/set-desc
 * @param desc - A 280 character or less string.
 */
router.post("/set-desc", GetSessionWithID, ValidateUser, async (req, res) => {
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

    let session = req.ktchiSession as SessionDocument;

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

/**
 * Toggles the highlighted status of a session.
 * @name POST /v1/sessions/:sessionID/toggle-highlight
 */
router.post("/toggle-highlight", GetSessionWithID, ValidateUser, async (req, res) => {
    let session = req.ktchiSession as SessionDocument;

    await db
        .get("sessions")
        .update({ _id: session._id }, { $set: { highlight: !session.highlight } });

    return res.status(200).json({
        success: true,
        description: `Successfully ${
            session.highlight ? "Unhighlighted session." : "Highlighted session!"
        }`,
        body: {
            highlightStatus: !session.highlight,
        },
    });
});

export default router;
