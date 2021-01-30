import * as express from "express";
const router = express.Router({ mergeParams: true });
import dbCore from "../../../core/db-core";

/**
 * @namespace /v1/tierlists
 */

const RETURN_LIMIT = 100;

/**
 * Retrieves tierlist objects.
 * @name GET /v1/tierlists
 */
router.get("/", async (req: KTRequest, res) => {
    // self note, the database name for tierlists is wrong, and it's actually called tierlist.
    // this needs to be fixed sometime.
    // (TODO)

    let dbRes = await dbCore.FancyDBQuery("tierlist", req.query, true, RETURN_LIMIT);

    return res.status(dbRes.statusCode).json(dbRes.body);
});

// mounts
import tierlistdataRouter from "./tierlistdata/tierlistdata";
router.use("/tierlistdata", tierlistdataRouter);

export default router;
