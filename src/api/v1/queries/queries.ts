import * as express from "express";
const router = express.Router({ mergeParams: true });
import dbCore from "../../../core/db-core";
import jsum from "jsum";
import db from "../../../db";
import apiConfig from "../../../apiconfig";

// mounted on /v1/queries

// query for queries
// confusing naming, i guess?
const RETURN_LIMIT = 100;
router.get("/query", async (req, res) => {
    try {
        let dbr = await dbCore.FancyDBQuery("queries", req.query, true, RETURN_LIMIT);

        if (dbr.body.success) {
            if (req.query.getAssocData === "true") {
                let users = await db.get("users").find(
                    {
                        id: { $in: dbr.body.body.items.map((e) => e.byUser) },
                    },
                    { projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS }
                );

                dbr.body.body.users = users;
            }
        }

        return res.status(dbr.statusCode).json(dbr.body);
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

router.delete("/remove-query", async (req, res) => {
    if (!req.body.queryID) {
        return res.status(400).json({
            success: false,
            description: "No queryID to remove provided.",
        });
    }

    let query = await db.get("queries").findOne({
        queryID: req.body.queryID,
    });

    if (!query) {
        return res.status(400).json({
            success: false,
            description: `Query ${req.body.queryID} does not exist.`,
        });
    }

    if (query.byUser !== req.apikey.assignedTo) {
        return res.status(401).json({
            success: false,
            description: "This is not your query to delete.",
        });
    }

    // else
    db.get("queries").remove({
        _id: query._id,
    });

    return res.status(200).json({
        success: true,
        description: `Successfully deleted ${query.name}`,
        body: query,
    });
});

const validQueryOptions = [
    "game",
    "userID",
    "titleSearch",
    "scoreData.difficulty",
    "scoreData.playtype",
    "scoreData.score",
    "scoreData.percent",
];

router.put("/add-query", async (req, res) => {
    if (!req.body.name) {
        return res.status(400).json({
            success: false,
            description: "No name provided.",
        });
    }

    if (!req.body.desc) {
        return res.status(400).json({
            success: false,
            description: "No description provided.",
        });
    }

    let strName = req.body.name;

    if (strName.length > 40) {
        return res.status(400).json({
            success: false,
            description: "Name of query cannot be longer than 40 chars.",
        });
    }

    let strDesc = req.body.desc;

    if (strDesc.length > 240) {
        return res.status(400).json({
            success: false,
            description: "Description of query cannot be longer than 240 chars.",
        });
    }

    let queryObj = { query: {} };

    for (const qOpt of validQueryOptions) {
        if (req.body[qOpt]) {
            let actualKeyName = qOpt.replace(/\./g, "¬");
            queryObj.query[actualKeyName] = req.body[qOpt];
        }
    }

    let queryID = jsum.digest(queryObj.query, "SHA1", "hex");

    let exists = await db.get("queries").findOne({
        queryID: queryID,
    });

    if (exists) {
        return res.status(409).json({
            success: false,
            description: `An identical query already exists - see ${exists.name}`,
        });
    }

    queryObj.queryID = queryID;
    queryObj.name = strName;
    queryObj.desc = strDesc;
    queryObj.byUser = req.apikey.assignedTo;
    queryObj.timeAdded = Date.now();
    queryObj.timesUsed = 0;
    queryObj.forDatabase = "scores"; // temp, can be expanded in future.

    db.get("queries").insert(queryObj);

    return res.status(201).json({
        success: true,
        description: `Successfully added query ${queryObj.name}.`,
        body: queryObj,
    });
});

export default router;
