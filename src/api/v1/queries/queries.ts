import * as express from "express";
const router = express.Router({ mergeParams: true });
import dbCore from "../../../core/db-core";
import JSum from "jsum";
import db from "../../../db";
import apiConfig from "../../../apiconfig";

/**
 * @namespace /v1/queries
 */

// query for queries
// confusing naming, i guess?
const RETURN_LIMIT = 100;

interface QueryFQReturns extends FancyQueryBody<unknown> {
    users: PublicUserDocument[];
}

/**
 * Performs a query for query documents.
 * haha - zkldi
 * @name GET /v1/queries
 */
router.get("/", async (req: KTRequest, res) => {
    let dbr = await dbCore.NBQuery<QueryDocument>("queries", req.query, true, RETURN_LIMIT);

    if (dbr.body.success) {
        if (req.query.getAssocUsers) {
            let users = await db.get("users").find(
                {
                    id: { $in: dbr.body.body.items.map((e) => e.byUser) },
                },
                { projection: apiConfig.REMOVE_PRIVATE_USER_RETURNS }
            );

            (dbr.body.body as QueryFQReturns).users = users;
        }
    }

    return res.status(dbr.statusCode).json(dbr.body);
});

/**
 * Deletes the query at the given ID.
 * @name DELETE /v1/queries/remove-query
 */
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

    if (query.byUser !== req.apikey!.assignedTo) {
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

/**
 * Creates a query and adds it to the query db.
 * @name PUT /v1/queries/add-query
 * @param name - The name of the query, must be less than 40 chars
 * @param desc - The description of the query, must be less than 240 chars.
 */
router.put("/add-query", async (req: KTRequest, res) => {
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

    let queryObj: Partial<QueryDocument> = { query: {} };

    for (const qOpt of validQueryOptions) {
        if (req.body[qOpt]) {
            let actualKeyName = qOpt.replace(/\./g, "¬");
            queryObj.query![actualKeyName] = req.body[qOpt];
        }
        if (req.body[`${qOpt}-opt`]) {
            let actualKeyName = qOpt.replace(/\./g, "¬");
            queryObj.query![`${actualKeyName}-opt`] = req.body[`${actualKeyName}-opt`];
        }
    }

    let queryID = JSum.digest(queryObj.query, "SHA1", "hex");

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
    queryObj.byUser = req.apikey!.assignedTo;
    queryObj.timeAdded = Date.now();
    queryObj.timesUsed = 0;
    queryObj.forDatabase = "scores"; // temp, can be expanded in future.

    await db.get("queries").insert(queryObj);

    return res.status(201).json({
        success: true,
        description: `Successfully added query ${queryObj.name}.`,
        body: queryObj,
    });
});

export default router;
