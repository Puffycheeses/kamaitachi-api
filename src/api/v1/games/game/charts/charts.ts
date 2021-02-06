import dbCore from "../../../../../core/db-core";
import * as express from "express";
const router = express.Router({ mergeParams: true });

/**
 * @namespace /v1/games/:game/charts
 */

const CHART_RET_LIMIT = 100;

/**
 * Performs a fancy query on the charts database for the given game.
 * @name GET /v1/games/:game/charts
 */
router.get("/", async (req: KTRequest, res) => {
    let dbRes = await dbCore.NBQuery<ChartDocument>(
        `charts-${req.params.game}` as ValidDatabases,
        req.query,
        true,
        CHART_RET_LIMIT,
        "charts"
    );
    return res.status(dbRes.statusCode).json(dbRes.body);
});

export default router;
