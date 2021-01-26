import * as express from "express";
const router = express.Router({ mergeParams: true });
const middlewares = require("../../../../middlewares.js");
const userHelpers = require("../../../../core/user-core.js");

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
const friendsRouter = require("./friends/friends.js");
const importsRouter = require("./imports/imports.js");
const notificationsRouter = require("./notifications/notifications.js");
const scoresRouter = require("./scores/scores.js");
const rankingRouter = require("./ranking/ranking.js");

router.use("/friends", friendsRouter);
router.use("/imports", importsRouter);
router.use("/notifications", notificationsRouter);
router.use("/scores", scoresRouter);
router.use("/ranking", rankingRouter);

module.exports = router;
