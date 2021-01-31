import * as express from "express";
const router = express.Router({ mergeParams: true });

/**
 * @namespace /v1
 */

const MAJOR_VER = 4;
const MINOR_VER = 1;
const PATCH_VER = 0;

router.use((req, res, next) => {
    res.header("Cache-Control", "max-age=0, must-revalidate");
    next();
});

/**
 * Returns the current status of the Kamaitachi API.
 * @name /v1
 */
router.get("/", async (req, res) =>
    res.status(200).json({
        success: true,
        body: {
            version: {
                major: MAJOR_VER,
                minor: MINOR_VER,
                patch: PATCH_VER,
            },
        },
        description: `Server Status OK. Running kamaitachi-api v${[
            MAJOR_VER,
            MINOR_VER,
            PATCH_VER,
        ].join(".")}`,
    })
);

// mounts:
import usersRouter from "./users/users";
import tierlistsRouter from "./tierlists/tierlists";
import scoresRouter from "./scores/scores";
import leaderboardsRouter from "./leaderboards/leaderboards";
import gamesRouter from "./games/games";
import rivalsRouter from "./rivals/rivals";
import importsRouter from "./imports/imports";
import statsRouter from "./stats/stats";
import queryRouter from "./queries/queries";
import folderRouter from "./folders/folders";
import sessionRouter from "./sessions/sessions";
import ffactRouter from "./fun-facts/fun-facts";
import goalRouter from "./goals/goals";
import milestonesRouter from "./milestones/milestones";
import userGoalsRouter from "./user-goals/user-goals";
import userMilestoneRouter from "./user-milestones/user-milestones";
import sessionFeedRouter from "./session-feed/session-feed";

router.use("/users", usersRouter);
router.use("/sessions", sessionRouter);
router.use("/tierlists", tierlistsRouter);
router.use("/leaderboards", leaderboardsRouter);
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
router.use("/session-feed", sessionFeedRouter);

// require APIKey more or less means "require logged in".
// since we're moving the API to be usable by people without accounts
// we need only restrict certain things behind this.
// people without accounts can ONLY make GET requests.
// so the only things we really need to look out for are get requests
// that use a logged in user as hint for where to get data from.

// router.use(middlewares.RequireAPIKey);

export default router;
