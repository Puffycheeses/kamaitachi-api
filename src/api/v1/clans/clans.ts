import * as express from "express";
const router = express.Router({ mergeParams: true });
import dbCore from "../../../core/db-core";

// mounted on /api/v1/clans

router.get("/", async function (req, res) {
    try {
        let dbRes = await dbCore.FancyDBQuery("clans", req.query, true);

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

// mounts
import clanRouter from "./clanID/clanID";

router.use("/:clanID", clanRouter);

export default router;
