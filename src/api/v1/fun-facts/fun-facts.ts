import * as express from "express";
const router = express.Router({ mergeParams: true });
import db from "../../../db";
import crypto from "crypto";
import userCore from "../../../core/user-core";
import apiConfig from "../../../apiconfig";

/**
 * @namespace /v1/fun-facts
 */

/**
 * Returns a random fun fact. If a user has nsfwsplashes disabled, this excludes nsfw splashes.
 * @name GET /v1/fun-facts
 */
router.get("/", async (req, res) => {
    if (!req.apikey) {
        return res.status(401).json({
            success: false,
            description: "You are not authorised for this!",
        });
    }

    let requestingUser = await db
        .get("users")
        .findOne(
            { id: req.apikey.assignedTo },
            { projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS }
        );

    let aggPipe: Record<string, unknown>[] = [
        {
            $sample: { size: 1 },
        },
    ];

    if (!requestingUser.settings.nsfwsplashes) {
        aggPipe.unshift({
            $match: { nsfw: false },
        });
    }

    let ffact = await db.get("fun-facts").aggregate(aggPipe);

    ffact = ffact[0];

    if (!ffact) {
        return res.status(400).json({
            success: false,
            description: "Did not find any fun facts.",
        });
    }

    let user = null;
    if (ffact.anonymous) {
        delete ffact.userID;
    } else {
        user = await userCore.GetUserWithID(ffact.userID);
    }

    return res.status(200).json({
        success: true,
        description: "Successfully found a fun fact.",
        body: {
            fact: ffact,
            user,
        },
    });
});

/**
 * Submits a fun fact.
 * @name PUT /v1/fun-facts
 * @param funfact - A 280 characters or less string containing the fun fact.
 * @param nsfw - If this fun fact is nsfw.
 * @param anonymous - If this fun fact should be anonymous.
 */
router.put("/", async (req, res) => {
    if (!req.body.funfact) {
        return res.status(400).json({
            success: false,
            description: "No funfact given.",
        });
    }

    if (req.body.funfact.length >= 280) {
        return res.status(400).json({
            success: false,
            description: "Fun facts cannot exceed 280 characters.",
        });
    }

    let exists = await db.get("fun-facts").findOne({
        text: req.body.funfact,
    });

    if (exists) {
        return res.status(409).json({
            success: false,
            description: "This fun fact is already in the database.",
        });
    }

    let ffactObj = {
        text: req.body.funfact,
        nsfw: !!req.body.nsfw,
        anonymous: !!req.body.anonymous,
        userID: req.apikey!.assignedTo,
        funfactID: crypto.randomBytes(20).toString("hex"),
        timestamp: Date.now(),
    };

    await db.get("fun-facts").insert(ffactObj);

    return res.status(200).json({
        success: true,
        description: "Successfully added fun fact.",
        body: ffactObj,
    });
});

export default router;
