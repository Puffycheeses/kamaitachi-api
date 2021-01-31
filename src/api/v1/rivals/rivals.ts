import db from "../../../db";
import dbCore from "../../../core/db-core";
import userHelpers from "../../../core/user-core";
import * as express from "express";
import crypto from "crypto";
import config from "../../../config/config";
import common from "../../../core/common-core";
const router = express.Router({ mergeParams: true });

/**
 * @namespace /v1/rivals
 */

const RETURN_LIMIT = 50;

/**
 * Performs a fancyquery on the rivals database.
 * @name GET /v1/rivals/
 */
router.get("/", async (req: KTRequest, res) => {
    let rivalsBody = await dbCore.FancyDBQuery("rivals", req.query, true, RETURN_LIMIT);

    return res.status(rivalsBody.statusCode).json(rivalsBody.body);
});

/**
 * Creates a new rival group.
 * @name POST /v1/rivals/create-group
 * @todo Investigate why the hell this is POST and not PUT?
 */
router.post("/create-group", async (req: KTRequest, res) => {
    if (!req.body.name || req.body.name.length > 40) {
        return res.status(400).json({
            success: false,
            description: "Invalid rival group name (>40 chars), or one was not provided.",
        });
    }

    if (req.body.desc && req.body.desc.length > 200) {
        return res.status(400).json({
            success: false,
            description: "Invalid rival group description (>200 chars).",
        });
    }

    if (!common.IsValidGame(req.body.game)) {
        return res.status(400).json({
            success: false,
            description: "Game is not supported",
        });
    }

    let playtype = req.body.playtype || config.defaultPlaytype[req.body.game];

    if (!common.IsValidPlaytype(playtype, req.body.game)) {
        return res.status(400).json({
            success: false,
            description: "This playtype isn't supported.",
        });
    }

    let desc = req.body.desc ? req.body.desc : "No Description Provided";

    let apiKey = req.body.key ? req.body.key : req.cookies.apikey;

    let founder = await userHelpers.GetUserWithAPIKey(apiKey);

    if (!founder) {
        return res.status(500).json({
            success: false,
            description:
                "Fatal error in grabbing your profile. This has been reported, but please ping me about this.",
        });
    }

    if (!founder.ratings[req.body.game] || !founder.ratings[req.body.game][playtype]) {
        return res.status(400).json({
            success: false,
            description: "You cannot create rival groups for games you haven't played.",
        });
    }

    let existingRGCount = await db.get("rivals").count({ founderID: founder.id });

    if (existingRGCount >= RETURN_LIMIT) {
        return res.status(400).json({
            success: false,
            description: `You cannot have more than ${RETURN_LIMIT} rival groups.`,
        });
    }

    let rgObj: RivalGroupDocument = {
        name: req.body.name,
        desc: desc,
        founderID: founder.id,
        members: [founder.id],
        mutualGroup: false,
        isDefault: false,
        game: req.body.game,
        playtype: playtype,
        settings: {
            scoreCompareMode: "relevant",
            strictness: 0.5,
            boundary: 0.1,
            cellShading: config.gameRelevantScoreBucket[req.body.game],
            scoreCompareFolderID: "",
        },
        rivalGroupID: crypto.randomBytes(20).toString("hex"),
    };

    await db.get("rivals").insert(rgObj);

    return res.status(200).json({
        success: true,
        description: `Successfully created group ${rgObj.name}`,
        body: rgObj,
    });
});

import rgRouter from "./rivalGroupID/rivalGroupID";
router.use("/rival-group/:rivalGroupID", rgRouter);

export default router;
