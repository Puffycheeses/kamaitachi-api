import * as express from "express";
const router = express.Router({ mergeParams: true });
import db from "../../../../db";

/**
 * @namespace /v1/imports/:importID
 */

async function GetImportWithID(req: KTRequest, res: express.Response, next: express.NextFunction) {
    let importObj = await db.get("imports").findOne({
        importID: req.params.importID,
    });

    if (!importObj) {
        return res.status(404).json({
            success: false,
            description: `Import with ID ${req.params.importID} could not be found.`,
        });
    }

    req.importObj = importObj;
    next();
}

/**
 * Returns the importID at the given ID.
 * @name GET /v1/imports/:importID
 */
router.get("/", GetImportWithID, async (req, res) =>
    res.status(200).json({
        success: true,
        description: "Found import successfully.",
        body: req.importObj,
    })
);

interface ImportScoresReturn {
    scores: ScoreDocument[];
    charts?: ChartDocument[];
    songs?: SongDocument[];
    nextStartPoint?: integer;
}

/**
 * Retrieves the scores associated with the given import. Limited to 500 scores at a time.
 * @name GET /v1/imports/:importID/scores
 * @param getAssocData - Also retrieves associated song and chart data.
 */
router.get("/scores", GetImportWithID, async (req, res) => {
    let importObj = req.importObj as ImportDocument;

    let start = parseInt(req.query.start) || 0;

    let limit = parseInt(req.query.limit) || 500;

    if (limit > 500) {
        limit = 500;
    }

    let scoreIDs = importObj.successfulScores.slice(start, start + limit);

    let scores = await db.get("scores").find({
        scoreID: { $in: scoreIDs },
    });

    if (req.query.getAssocData) {
        let songs = await db.get(`songs-${importObj.game}`).find({
            id: { $in: scores.map((e) => e.songID) },
        });

        let charts: ChartDocument[] = [];
        if (scores.length !== 0) {
            charts = await db.get(`charts-${importObj.game}`).find({
                chartID: { $in: scores.map((e) => e.chartID) },
            });
        }

        let retBody: ImportScoresReturn = {
            songs,
            charts,
            scores,
        };

        if (start + limit < importObj.successfulScores.length) {
            retBody.nextStartPoint = start + limit;
        }

        return res.status(200).json({
            success: true,
            description: `Found ${scores.length} scores.`,
            body: retBody,
        });
    } else {
        let retBody: ImportScoresReturn = {
            scores,
        };

        if (start + limit < importObj.successfulScores.length) {
            retBody.nextStartPoint = start + limit;
        }

        return res.status(200).json({
            success: true,
            description: `Found ${scores.length} scores.`,
            body: retBody,
        });
    }
});

export default router;
