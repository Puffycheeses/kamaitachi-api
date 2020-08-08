const express = require("express");
const router = express.Router({mergeParams: true});

// mounted on /v1

const MAJOR_VER = 1;
const MINOR_VER = 3;
const PATCH_VER = 1;

router.get("/", async function(req,res){
    return res.status(200).json({
        success: true,
        body: {
            version: {
                major: MAJOR_VER,
                minor: MINOR_VER,
                patch: PATCH_VER
            }
        },
        description: "Server Status OK. Running kamaitachi-api v" + [MAJOR_VER,MINOR_VER,PATCH_VER].join(".")
    });
});

// mounts:
const usersRouter = require("./users/users.js");
const tierlistsRouter = require("./tierlists/tierlists.js");
const scoresRouter = require("./scores/scores.js");
const leaderboardsRouter = require("./leaderboards/leaderboards.js");
const gamesRouter = require("./games/games.js");
const rivalsRouter = require("./rivals/rivals.js");
const clansRouter = require("./clans/clans.js");

router.use("/users", usersRouter);
router.use("/rivals", rivalsRouter);
router.use("/tierlists", tierlistsRouter);
router.use("/scores", scoresRouter);
router.use("/leaderboards", leaderboardsRouter);
router.use("/games", gamesRouter);
router.use("/clans", clansRouter);

module.exports = router;