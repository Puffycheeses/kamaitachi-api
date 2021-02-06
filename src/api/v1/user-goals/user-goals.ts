import * as express from "express";
import dbCore from "../../../core/db-core";
const router = express.Router({ mergeParams: true });
import db from "../../../db";
import userCore from "../../../core/user-core";

/**
 * @namespace /v1/user-goals
 */

const MAX_RETURNS = 100;

interface UserGoalFQReturn extends FancyQueryBody<UserGoalDocument> {
    users?: PublicUserDocument[];
    goals?: GoalDocument[];
}

/**
 * Performs a fancy query on the user-goals database.
 * @name GET /v1/user-goals
 */
router.get("/", async (req: KTRequest, res) => {
    let dbRes = await dbCore.NBQuery<UserGoalDocument>("user-goals", req.query, true, MAX_RETURNS);

    if (dbRes.body.success) {
        if (req.query.getAssocUsers === "true") {
            let assocUsers = await userCore.GetUsers(dbRes.body.body.items.map((e) => e.userID));

            (dbRes.body.body as UserGoalFQReturn).users = assocUsers;
        }

        if (req.query.getAssocGoals === "true") {
            let assocGoals = await db.get("goals").find({
                goalID: { $in: dbRes.body.body.items.map((e) => e.goalID) },
            });

            (dbRes.body.body as UserGoalFQReturn).goals = assocGoals;
        }
    }
    return res.status(dbRes.statusCode).json(dbRes.body);
});

export default router;
