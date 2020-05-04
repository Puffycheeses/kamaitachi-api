const express = require("express");
const router = express.Router({mergeParams: true});
const middlewares = require("../../../../middlewares.js");
const userHelpers = require("../../../../helpers/userhelpers.js");

// mounted on /api/v1/users/:userID

router.use(middlewares.RequireExistingUser);

router.get("/", async function(req,res){
    let user = await userHelpers.GetUser(req.params.userID);

    return res.status(200).json({
        success: true,
        description: "Successfully found user '" + req.params.userID + "'",
        body: {
            user: user
        }
    });
});

// mounts
const friendsRouter = require("./friends/friends.js");
const importsRouter = require("./imports/imports.js");
const notificationsRouter = require("./notifications/notifications.js");
const sessionsRouter = require("./sessions/sessions.js");

router.use("/friends", friendsRouter);
router.use("/imports", importsRouter);
router.use("/notifications", notificationsRouter);
router.use("/sessions", sessionsRouter);

module.exports = router;