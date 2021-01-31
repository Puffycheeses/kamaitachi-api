import * as express from "express";
const router = express.Router({ mergeParams: true });
import middlewares from "../../../../middlewares";

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
        body: {
            item: req.requestedUser,
        },
    })
);

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
