import * as express from "express";
import dbCore from "../../../core/db-core";
const router = express.Router({ mergeParams: true });

/**
 * @namespace /v1/imports
 */

const MAX_RETURNS = 100;

/**
 * Performs a FancyQuery on imports.
 * @name GET /v1/imports
 */
router.get("/", async (req: KTRequest, res) => {
    let dbRes = await dbCore.NBQuery<ImportDocument>("imports", req.query, true, MAX_RETURNS);
    return res.status(dbRes.statusCode).json(dbRes.body);
});

import importID from "./importID/importID";

router.use("/:importID", importID);

export default router;
