import * as express from "express";
const router = express.Router({ mergeParams: true });
const middlewares = require("../../middlewares.js");

// mounted on /v1

const MAJOR_VER = 4;
const MINOR_VER = 1;
const PATCH_VER = 0;

router.use((req, res, next) => {
    res.header("Cache-Control", "max-age=0, must-revalidate");
    next();
});

router.get("/", async function (req, res) {
    return res.status(200).json({
        success: true,
        body: {
            version: {
                major: MAJOR_VER,
                minor: MINOR_VER,
                patch: PATCH_VER,
            },
        },
        description: `Server Status OK. Running kamaitachi-api v${[MAJOR_VER, MINOR_VER, PATCH_VER].join(".")}`,
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
const sessionFeedRouter = require("./session-feed/session-feed.js");

router.use("/users", usersRouter);
router.use("/sessions", sessionRouter);
router.use("/tierlists", tierlistsRouter);
router.use("/leaderboards", leaderboardsRouter);
router.use("/search", searchRouter);
router.use("/queries", queryRouter);
router.use("/stats", statsRouter);
router.use("/scores", scoresRouter);
router.use("/games", gamesRouter);
router.use("/rivals", rivalsRouter);
router.use("/goals", goalRouter);
router.use("/milestones", milestonesRouter);
router.use("/user-goals", userGoalsRouter);
router.use("/user-milestones", userMilestoneRouter);
router.use("/imports", importsRouter);
router.use("/folders", folderRouter);
router.use("/fun-facts", ffactRouter);
router.use("/clans", clansRouter);
router.use("/session-feed", sessionFeedRouter);

// require APIKey more or less means "require logged in".
// since we're moving the API to be usable by people without accounts
// we need only restrict certain things behind this.
// people without accounts can ONLY make GET requests.
// so the only things we really need to look out for are get requests
// that use a logged in user as hint for where to get data from.

// router.use(middlewares.RequireAPIKey);

module.exports = router;
