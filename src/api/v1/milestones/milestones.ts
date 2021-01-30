import * as express from "express";
import dbCore from "../../../core/db-core";
const router = express.Router({ mergeParams: true });
import db from "../../../db";
import apiConfig from "../../../apiconfig";
// mounted on /api/v1/milestones

const MAX_RETURNS = 100;
router.get("/", async (req, res) => {
    try {
        let dbRes = await dbCore.FancyDBQuery("milestones", req.query, true, MAX_RETURNS);

        if (dbRes.body.success) {
            if (req.query.getAssocUsers) {
                let users = await db.get("users").find(
                    {
                        id: { $in: dbRes.body.body.items.map((e) => e.createdBy) },
                    },
                    {
                        projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS,
                    }
                );

                dbRes.body.body.users = users;
            }
        }
        return res.status(dbRes.statusCode).json(dbRes.body);
    } catch (r) {
        if (r.statusCode && r.body) {
            return res.status(r.statusCode).json(r.body);
        } else {
            console.error(req.originalUrl);
            console.error(r);
            return res.status(500).json({
                success: false,
                description: "An unknown internal server error has occured.",
            });
        }
    }
});

import milestoneIDRouter from "./milestoneID/milestoneID";

router.use("/milestone/:milestoneID", milestoneIDRouter);

export default router;
