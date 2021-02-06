import * as express from "express";
const router = express.Router({ mergeParams: true });
import middlewares from "../../../../middlewares";
import db from "../../../../db";

/**
 * @namespace /v1/users/:userID
 */

router.use(middlewares.RequireExistingUser);

/**
 * Returns the user at this ID.
 * @name GET /v1/users/:userID
 */
router.get("/", async (req, res) =>
    res.status(200).json({
        success: true,
        description: `Successfully found user '${req.requestedUser}'`,
        body: req.requestedUser,
    })
);

/**
 * Determines whether the user is linked with the given service.
 * This can only be accessed by the requesting user.
 * @name GET /v1/users/:userID/link-status
 */
router.get("/link-status", middlewares.RequireUserKeyMatch, async (req: KTRequest, res) => {
    if (!["arc", "flo", "eag"].includes(req.query.service)) {
        return res.status(400).json({
            success: false,
            description: "Invalid service.",
        });
    }

    // get the integration info of the user.
    let secureUser = await db.get("users").findOne({ id: req.user!.id });

    return res.status(200).json({
        success: true,
        description: "Retrieved link status.",
        body: {
            linkStatus: !!secureUser?.integrations?.[req.query.service]?.authStatus,
        },
    });
});

// mounts
import friendsRouter from "./friends/friends";
import notificationsRouter from "./notifications/notifications";
import scoresRouter from "./scores/scores";
import rankingRouter from "./ranking/ranking";

router.use("/friends", friendsRouter);
router.use("/notifications", notificationsRouter);
router.use("/scores", scoresRouter);
router.use("/ranking", rankingRouter);

export default router;
