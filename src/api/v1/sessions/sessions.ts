import * as express from "express";
import dbCore from "../../../core/db-core";
import sessionCore from "../../../core/session-core";
const router = express.Router({ mergeParams: true });
import userCore from "../../../core/user-core";

/**
 * @namespace /v1/sessions
 */

const MAX_RETURNS = 100;

interface SessionFQResponse extends FancyQueryBody<SessionDocument> {
    users?: PublicUserDocument[];
}

/**
 * Performs a fancyquery on sessions.
 * @name GET /v1/sessions
 */
router.get("/", async (req: KTRequest, res) => {
    let queryObj = {};

    try {
        queryObj = await sessionCore.HandleCustomUserSelections(req, queryObj);
    } catch (e) {
        if (e.statusCode && e.body) {
            return res.status(e.statusCode).json(e.body);
        } else {
            console.error(`===== FATAL IN /SESSIONS HandleCustomUserSelections ======`);
            console.error(e);
            console.error(`${req.originalUrl}`);
            console.error(`===== END ERROR LOG =====`);
        }
    }

    let dbRes = await dbCore.NBQuery<SessionDocument>(
        "sessions",
        req.query,
        true,
        MAX_RETURNS,
        undefined,
        queryObj
    );

    if (dbRes.body.success) {
        if (req.query.getAssocData === "true") {
            (dbRes.body.body as SessionFQResponse).users = await userCore.GetUsers(
                dbRes.body.body.items.map((e) => e.userID)
            );
        }
    }
    return res.status(dbRes.statusCode).json(dbRes.body);
});

import sessionIDRouter from "./sessionID/sessionID";

router.use("/:sessionID", sessionIDRouter);

export default router;
