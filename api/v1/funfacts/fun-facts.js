const express = require("express");
const dbHelpers = require("../../../../core/db-core.js");
const router = express.Router({mergeParams: true});
const db = require("../../../../db.js");
const crypto = require("crypto");

// mounted on /api/v1/fun-facts

router.get("/", async function(req,res){
    let ffact = await db.get("fun-facts").aggregate([{
        $sample: {size: 1}
    }]);

    return res.status(200).json({
        success: true,
        description: "Successfully found a fun fact.",
        body: {
            fact: ffact
        }
    });
});

router.put("/submit-fun-fact", async function (req, res){
    if (!req.body.funfact) {
        return res.status(400).json({
            success: false,
            description: "No funfact given."
        });
    }

    if (req.body.funfact.length > 280) {
        return res.status(400).json({
            success: false,
            description: "Fun facts cannot exceed 280 characters."
        });
    }

    let ffactObj = {
        text: req.body.funfact,
        nsfw: !!req.body.nsfw,
        userID: req.apikey.assignedTo,
        funfactID: crypto.randomBytes(20).toString("hex")
    }

    await db.get("fun-facts").insert(ffactObj);

    return res.status(200).json({
        success: true,
        description: "Successfully added fun fact.",
        body: ffactObj
    });
});

module.exports = router;