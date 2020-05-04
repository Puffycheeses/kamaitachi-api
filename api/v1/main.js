const express = require("express");
const router = express.Router({mergeParams: true});

// mounted on /api/v1

router.get("/", async function(req,res){
    return res.status(200).json({
        success: true,
        version: {
            major: 1,
            minor: 0,
            patch: 0
        },
        description: "Server Status OK"
    });
});

// mounts:
const usersRouter = require("./users/users.js");
const tierlistsRouter = require("./tierlists/tierlists.js");
const scoresRouter = require("./scores/scores.js");
const leaderboardsRouter = require("./leaderboards/leaderboards.js");
const gamesRouter = require("./games/games.js");
const clansRouter = require("./clans/clans.js");

router.use("/users", usersRouter);
router.use("/tierlists", tierlistsRouter);
router.use("/scores", scoresRouter);
router.use("/leaderboards", leaderboardsRouter);
router.use("/games", gamesRouter);
router.use("/clans", clansRouter);

module.exports = router;