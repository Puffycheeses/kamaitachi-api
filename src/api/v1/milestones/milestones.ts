import * as express from "express";
import dbCore from "../../../core/db-core";
const router = express.Router({ mergeParams: true });
import userCore from "../../../core/user-core";

/**
 * @namespace /v1/milestones
 */

const MAX_RETURNS = 100;

interface MilestoneFQReturns extends FancyQueryBody<unknown> {
    users: PublicUserDocument[];
}

/**
 * Performs a FancyQuery on milestones.
 * @name GET /v1/milestones
 */
router.get("/", async (req: KTRequest, res) => {
    let dbRes = await dbCore.NBQuery<MilestoneDocument>("milestones", req.query, true, MAX_RETURNS);

    if (dbRes.body.success) {
        if (req.query.getAssocUsers) {
            let users = await userCore.GetUsers(dbRes.body.body.items.map((e) => e.createdBy));

            (dbRes.body.body as MilestoneFQReturns).users = users;
        }
    }
    return res.status(dbRes.statusCode).json(dbRes.body);
});

import milestoneIDRouter from "./milestoneID/milestoneID";

router.use("/milestone/:milestoneID", milestoneIDRouter);

export default router;
