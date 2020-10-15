const express = require("express");
const router = express.Router({mergeParams: true});

// mounted on /v1

const MAJOR_VER = 3;
const MINOR_VER = 4;
const PATCH_VER = 0;

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
const importsRouter = require("./imports/imports.js");
const statsRouter = require("./stats/stats.js");
const queryRouter = require("./queries/queries.js");
const folderRouter = require("./folders/folders.js");
const sessionRouter = require("./sessions/sessions.js");
const ffactRouter = require("./fun-facts/fun-facts.js");
const goalRouter = require("./goals/goals.js");
const milestonesRouter = require("./milestones/milestones.js");
const userGoalsRouter = require("./user-goals/user-goals.js");
const userMilestoneRouter = require("./user-milestones/user-milestones.js");
const searchRouter = require("./search/search.js");

router.use("/users", usersRouter);
router.use("/rivals", rivalsRouter);
router.use("/tierlists", tierlistsRouter);
router.use("/scores", scoresRouter);
router.use("/leaderboards", leaderboardsRouter);
router.use("/games", gamesRouter);
router.use("/clans", clansRouter);
router.use("/imports", importsRouter);
router.use("/stats", statsRouter);
router.use("/queries", queryRouter);
router.use("/folders", folderRouter);
router.use("/sessions", sessionRouter);
router.use("/fun-facts", ffactRouter);
router.use("/goals", goalRouter);
router.use("/milestones", milestonesRouter);
router.use("/user-goals", userGoalsRouter);
router.use("/user-milestones", userMilestoneRouter);
router.use("/search", searchRouter);

module.exports = router;