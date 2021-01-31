import * as express from "express";
const router = express.Router({ mergeParams: true });
import middlewares from "../../../../../middlewares";
import dbCore from "../../../../../core/db-core";
import db from "../../../../../db";

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

    let dbRes = await dbCore.FancyDBQuery("notifications", req.query, true, MAX_RETURNS);

    return res.status(dbRes.statusCode).json(dbRes.body);
});

/**
 * Deletes a notification at the given ID.
 * @name DELETE /v1/users/:userID/notifications/:notifID
 */
router.delete("/:notifID", async (req, res) => {
    let notif = await db.get("notifications").findOne({
        notifID: req.params.notifID,
        toUserID: req.apikey!.assignedTo,
    });

    if (!notif) {
        return res.status(404).json({
            success: false,
            description: "This notification does not exist or no longer exists.",
        });
    }

    await db.get("notifications").remove({
        _id: notif._id,
    });

    return res.status(200).json({
        success: true,
        description: "Successfully deleted notification.",
        body: notif,
    });
});

export default router;
