import dbCore from "../../../../core/db-core";
import * as express from "express";
const router = express.Router({ mergeParams: true });
import tierlistCore from "../../../../core/tierlist-core";
import common from "../../../../core/common-core";

/**
 * @namespace /v1/tierlists/tierlistdata
 */

const RETURN_LIMIT = 100;

interface TierlistDataResponse extends FancyQueryBody<TierlistDataDocument> {
    tierlist: TierlistDocument;
}

/**
 * Retrieves up to 100 tierlistdata objects for a given tierlist.
 * @name GET /v1/tierlists/tierlistdata
 * @param tierlistID - the ID of the tierlist you wish to request tierlistdata from.
 * @param game - Alternatively, providing a game and a playtype, this will select the default
 * tierlist for said game.
 * @param playtype - See above, necessary if providing game.
 */
router.get("/", async (req: KTRequest, res) => {
    let tierlist = null;

    if (!common.IsValidGame(req.query.game)) {
        return res.status(400).json({
            success: false,
            description: `Invalid value for game ${req.query.game}`,
        });
    }

    if (!common.IsValidPlaytype(req.query.playtype, req.query.game)) {
        return res.status(400).json({
            success: false,
            description: `Invalid value for playtype ${req.query.playtype} for game ${req.query.game}`,
        });
    }

    if (req.query.tierlistID) {
        tierlist = await tierlistCore.GetTierlistWithID(req.query.tierlistID);
    } else {
        tierlist = await tierlistCore.GetDefaultTierlist(req.query.game, req.query.playtype);
    }

    if (!tierlist) {
        return res.status(400).json({
            success: false,
            description: "No tierlist could be found that matches this criteria.",
        });
    }

    req.query.tierlistID = tierlist.tierlistID;

    let dbRes = await dbCore.FancyDBQuery<TierlistDataDocument>(
        "tierlistdata",
        req.query,
        true,
        RETURN_LIMIT
    );

    if (dbRes.body.success) {
        (dbRes.body.body as TierlistDataResponse).tierlist = tierlist;
    }

    return res.status(dbRes.statusCode).json(dbRes.body);
});

export default router;
