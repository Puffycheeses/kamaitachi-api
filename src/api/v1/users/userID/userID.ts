import * as express from "express";
const router = express.Router({ mergeParams: true });
import middlewares from "../../../../middlewares";

// mounted on /api/v1/users/:userID

router.use(middlewares.RequireExistingUser);

router.get("/", async function (req, res) {
    let user = req.requestedUser;

    return res.status(200).json({
        success: true,
        description: `Successfully found user '${req.params.userID}'`,
        body: {
            item: user,
        },
    });
});

// mounts
import friendsRouter from "./friends/friends";
import importsRouter from "./imports/imports";
import notificationsRouter from "./notifications/notifications";
import scoresRouter from "./scores/scores";
import rankingRouter from "./ranking/ranking";

router.use("/friends", friendsRouter);
router.use("/imports", importsRouter);
router.use("/notifications", notificationsRouter);
router.use("/scores", scoresRouter);
router.use("/ranking", rankingRouter);

export default router;
