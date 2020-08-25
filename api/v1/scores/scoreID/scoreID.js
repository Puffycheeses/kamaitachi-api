const express = require("express");
const router = express.Router({mergeParams: true});
const db = require("../../../db.js");

// mounted on /api/v1/scores/:scoreID

async function ValidateAndGetScore(req,res,next) {
    let score = await db.get("scores").findOne({
        scoreID: req.params.scoreID
    });

    if (!score){
        return res.status(404).json({
            success: false,
            description: "Score with ID " + req.params.scoreID + " does not exist."
        });
    }

    req.score = score;
    next();
}

router.use(ValidateAndGetScore);

async function ScoreUserKeyMatch(req, res, next){
    if (req.apikey.assignedTo !== req.score.userID){
        return res.status(401).json({
            success: false,
            description: "This is not your score to edit."
        });
    }

    next();
}

router.get("/", async function(req,res){
    return res.status(200).json({
        success: true,
        description: "Found score with ID: " + req.params.scoreID,
        body: req.score
    });
});

router.patch("/edit-comment", ScoreUserKeyMatch, async function(req,res){
    if (!req.body.comment){
        return res.status(400).json({
            success: false,
            description: "No comment provided."
        });
    }

    if (req.body.comment.length > 240){
        return res.status(400).json({
            success: false,
            description: "Comment is too long, comments must be less than 240 characters."
        });
    }

    db.get("scores").update({
        _id: req.score._id
    }, {
        $set: {
            comment: req.body.comment
        }
    });

    return res.status(200).json({
        success: true,
        description: `Updated comment from ${score.comment} to ${req.body.comment}`,
        body: {
            oldComment: score.comment,
            newComment: req.body.comment
        }
    });
});

router.patch("/remove-comment", ScoreUserKeyMatch, async function(req,res){
    db.get("scores").update({
        _id: req.score._id
    }, {
        $unset: {
            comment: 1
        }
    });

    return res.status(200).json({
        success: true,
        description: `Removed comment of ${score.comment}`,
        body: {
            removedComment: score.comment,
        }
    });
});

module.exports = router;