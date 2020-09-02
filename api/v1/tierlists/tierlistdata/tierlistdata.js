const db = require("../../../../db.js");
const dbHelpers = require("../../../../core/db-core.js");
const express = require("express");
const router = express.Router({mergeParams: true});
const tierlistHelpers = require("./tierlisthelpers.js");

// mounted on /api/v1/tierlists/tierlistdata

const RETURN_LIMIT = 100;

router.get("/", async function(req,res){
    let tierlist = null;
    if (req.query.tierlistID){
        tierlist = await tierlistHelpers.GetTierlistWithID(req.query.tierlistID);
    }
    else{
        tierlist = await tierlistHelpers.GetDefaultTierlist(req.query.game, req.query.playtype);
    }

    if (!tierlist){
        return res.status(400).json({
            success: false,
            description: "No tierlist could be found that matches this criteria."
        });
    }

    req.query.tierlistID = tierlist.tierlistID;

    try {
        let dbRes = await dbHelpers.FancyDBQuery(
            "tierlistdata",
            req.query,
            true,
            RETURN_LIMIT
        );
    
        return res.status(dbRes.statusCode).json(dbRes.body);
    }
    catch (r) {
        if (r.statusCode && r.body){
            return res.status(r.statusCode).json(r.body);
        }
        else {
            console.error(req.originalUrl);
            console.error(r);
            return res.status(500).json({
                success: false,
                description: "An unknown internal server error has occured."
            });
        }
    }

});


module.exports = router;