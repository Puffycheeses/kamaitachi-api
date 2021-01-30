import * as express from "express";
const router = express.Router({ mergeParams: true });
import db from "../../../../db";

/**
 * @namespace v1/scores/:scoreID
 */

/**
 * Middleware function for retrieving a score at a given ID. returns 404 if one cannot be found.
 */
async function ValidateAndGetScore(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    let score = await db.get("scores").findOne({
        scoreID: req.params.scoreID,
    });

    if (!score) {
        return res.status(404).json({
            success: false,
            description: `Score with ID ${req.params.scoreID} does not exist.`,
        });
    }

    req.score = score;
    next();
}

router.use(ValidateAndGetScore);

/**
 * Middleware function for determining whether a score belongs to the requesting user.
 */
async function ScoreUserKeyMatch(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    if (req.apikey?.assignedTo !== req.score?.userID) {
        return res.status(401).json({
            success: false,
            description: "This is not your score to edit.",
        });
    }

    next();
}

/**
 * Returns the exactly requested score document.
 * @name GET /v1/scores/:scoreID
 */
router.get("/", async (req, res) =>
    res.status(200).json({
        success: true,
        description: `Found score with ID: ${req.params.scoreID}`,
        body: req.score,
    })
);

/**
 * Changes the highlight status of the requested score document.
 * @access Requesting user must be the creator of the given score.
 * @name PATCH /v1/scores/:scoreID/toggle-highlight
 */
router.patch("/toggle-highlight", ScoreUserKeyMatch, async (req, res) => {
    let score = req.score as ScoreDocument;

    await db.get("scores").update(
        {
            _id: score._id,
        },
        {
            $set: {
                highlight: !score.highlight,
            },
        }
    );

    return res.status(200).json({
        success: true,
        description: score.highlight ? "Unhighlighted score." : "Highlighted score!",
        body: {
            highlightStatus: !score.highlight,
        },
    });
});

/**
 * Edits the comment of the requested score document.
 * @access Requesting user must be the creator of the given score.
 * @name PATCH /v1/scores/:scoreID/edit-comment
 * @param comment - a 240 characters or less string representing the comment to add to the score.
 */
router.patch("/edit-comment", ScoreUserKeyMatch, async (req, res) => {
    if (!req.body.comment) {
        return res.status(400).json({
            success: false,
            description: "No comment provided.",
        });
    }

    if (req.body.comment.length >= 240) {
        return res.status(400).json({
            success: false,
            description: "Comment is too long, comments must be less than 240 characters.",
        });
    }

    let score = req.score as ScoreDocument;

    await db.get("scores").update(
        {
            _id: score._id,
        },
        {
            $set: {
                comment: req.body.comment,
            },
        }
    );

    return res.status(200).json({
        success: true,
        description: `Updated comment from ${score.comment || "<No Comment>"} to ${
            req.body.comment
        }`,
        body: {
            oldComment: score.comment,
            newComment: req.body.comment,
        },
    });
});

/**
 * Edits the comment of the requested score document.
 * @access Requesting user must be the creator of the given score.
 * @name PATCH /v1/scores/:scoreID/remove-comment
 */
router.patch("/remove-comment", ScoreUserKeyMatch, async (req, res) => {
    let score = req.score as ScoreDocument;

    await db.get("scores").update(
        {
            _id: score._id,
        },
        {
            $set: {
                comment: null,
            },
        }
    );

    return res.status(200).json({
        success: true,
        description: `Removed comment of ${score.comment}`,
        body: {
            removedComment: score.comment,
        },
    });
});

export default router;
