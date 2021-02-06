import * as express from "express";
const router = express.Router({ mergeParams: true });
import middlewares from "../../../../../middlewares";
import dbCore from "../../../../../core/db-core";

/**
 * @namespace /v1/users/:userID/notifications
 */

// users can only access their own notifications.
router.use(middlewares.RequireUserKeyMatch);

const MAX_RETURNS = 100;

/**
 * Performs a fancy query on the users own notifications.
 * @name GET /v1/users/:userID/notifications
 */
router.get("/", async (req: KTRequest, res) => {
    let user = req.requestedUser as PublicUserDocument;

    req.query.toUserID = user.id.toString();

    let dbRes = await dbCore.NBQuery<NotificationDocument>(
        "notifications",
        req.query,
        true,
        MAX_RETURNS
    );

    return res.status(dbRes.statusCode).json(dbRes.body);
});

import notifIDRouter from "./notifID/notifID";

router.use("/:notifID", notifIDRouter);

export default router;
