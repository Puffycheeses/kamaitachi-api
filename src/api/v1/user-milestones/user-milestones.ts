import * as express from "express";
import dbCore from "../../../core/db-core";
const router = express.Router({ mergeParams: true });
import db from "../../../db";
import userCore from "../../../core/user-core";

/**
 * @namespace /v1/user-milestones
 */

const MAX_RETURNS = 100;

interface UserMilestoneFQReturn extends FancyQueryBody<UserMilestoneDocument> {
    milestones?: MilestoneDocument[];
    users?: PublicUserDocument[];
}

/**
 * Performs a fancy query on the user-milestones database.
 * @name GET /v1/user-milestones
 */
router.get("/", async (req: KTRequest, res) => {
    let dbRes = (await dbCore.FancyDBQuery(
        "user-milestones",
        req.query,
        true,
        MAX_RETURNS
    )) as FancyQueryPseudoResponse<UserMilestoneDocument>;

    if (dbRes.body.success) {
        if (req.query.getAssocUsers) {
            let assocUsers = await userCore.GetUsers(dbRes.body.body.items.map((e) => e.userID));

            (dbRes.body.body as UserMilestoneFQReturn).users = assocUsers;
        }

        if (req.query.getAssocMilestones) {
            let assocMilestones = await db.get("milestones").find({
                goalID: { $in: dbRes.body.body.items.map((e) => e.milestoneID) },
            });

            (dbRes.body.body as UserMilestoneFQReturn).milestones = assocMilestones;
        }
    }

    return res.status(dbRes.statusCode).json(dbRes.body);
});

export default router;
