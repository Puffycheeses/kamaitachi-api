import * as express from "express";
const router = express.Router({ mergeParams: true });
import db from "../../../../../../db";

/**
 * @namespace /v1/users/:userID/notifications/:notifID
 */

async function GetNotification(req: KTRequest, res: express.Response, next: express.NextFunction) {
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

    req.ktchiNotification = notif;
    return next();
}

router.use(GetNotification);

router.get("/", async (req, res) =>
    res.status(200).json({
        success: true,
        description: "Successfully found notification.",
        body: req.ktchiNotification,
    })
);

/**
 * Deletes a notification at the given ID.
 * @name DELETE /v1/users/:userID/notifications/:notifID
 */
router.delete("/", async (req, res) => {
    let notif = req.ktchiNotification as NotificationDocument;

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
