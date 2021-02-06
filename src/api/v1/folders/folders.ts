import * as express from "express";
import dbCore from "../../../core/db-core";
const router = express.Router({ mergeParams: true });
import db from "../../../db";
import config from "../../../config/config";
import folderCore from "../../../core/folder-core";
import common from "../../../core/common-core";
import userCore from "../../../core/user-core";

/**
 * @namespace /v1/folders
 */

const MAX_RETURNS = 100;

/**
 * Returns up to 100 folders.
 * @name GET /v1/folders
 */
router.get("/", async (req: KTRequest, res) => {
    let dbRes = await dbCore.NBQuery<FolderDocument>("folders", req.query, true, MAX_RETURNS);
    return res.status(dbRes.statusCode).json(dbRes.body);
});

/**
 * Returns the folders inside a table.
 * @name GET /v1/table-folders
 */
router.get("/table-folders", async (req: KTRequest, res) => {
    if (!common.IsValidGame(req.query.game)) {
        return res.status(400).json({
            success: false,
            description: "No valid game given.",
        });
    }

    let tableName = config.defaultTable[req.query.game];

    if (req.query.table) {
        if (config.folderTables[req.query.game].includes(req.query.table)) {
            tableName = req.query.table;
        } else {
            return res.status(404).json({
                success: false,
                description: "Table provided, but was not valid!",
            });
        }
    }

    let tableFolders = await db.get("folders").find({
        game: req.query.game,
        custom: false,
        table: tableName,
    });

    return res.status(200).json({
        success: true,
        description: `Successfully returned ${tableFolders.length} folders.`,
        body: {
            folders: tableFolders,
            tableName,
        },
    });
});
interface TableStat {
    allScores: integer;
    uniqueScores: integer;
    totalCharts: integer;
    lampDist: Record<string, integer>;
    gradeDist: Record<string, integer>;
    gradeFolderLamp: string | null;
    lampFolderLamp: string | null;
}

type TableStatsObject = Record<Playtypes[Game], TableStat>;

/**
 * Returns the folders inside a table (A set of folders).
 * This requires a user to be logged in, or one to specifically be passed.
 * This also returns the given users statistics on said table.
 * @name GET /v1/folders/table-statistics
 */
router.get("/table-statistics", async (req: KTRequest, res) => {
    if (!common.IsValidGame(req.query.game)) {
        return res.status(400).json({
            success: false,
            description: "No valid game given.",
        });
    }

    let tableName = config.defaultTable[req.query.game];
    if (req.query.table) {
        if (config.folderTables[req.query.game].includes(req.query.table)) {
            tableName = req.query.table;
        } else {
            return res.status(404).json({
                success: false,
                description: "Table provided, but was not valid!",
            });
        }
    }

    let userID: integer;

    if (parseInt(req.query.userID)) {
        let u = await userCore.GetUser(req.query.userID);

        if (u) {
            userID = u.id;
        } else {
            return res.status(404).json({
                success: false,
                description: "Requested user does not exist.",
            });
        }
    } else if (req.user) {
        userID = req.user.id;
    } else {
        return res.status(401).json({
            success: false,
            description:
                "Cannot request folders for no user! (If you're logged in, this defaults to whoever you're logged in as).",
        });
    }

    let game = req.query.game;

    let playtype = common.IsValidPlaytype(req.query.playtype, game)
        ? req.query.playtype
        : config.defaultPlaytype[game];

    // we are going to make a COOL caching optimisation here
    let dataCache = await db.get("folderdata-cache").findOne({
        game: game,
        playtype: playtype,
        userID: userID,
        table: tableName,
        validUntil: { $gt: Date.now() },
    });

    if (dataCache) {
        return res.status(200).json({
            success: true,
            description: "Returned folder cache.",
            body: dataCache.body,
        });
    }

    let tableFolders = await db.get("folders").find({
        game: game,
        custom: false,
        table: tableName,
    });

    if (!tableFolders.length) {
        return res.status(404).json({
            success: false,
            description: "This table has no folders!",
        });
    }

    let stats: Record<string, Partial<TableStatsObject>> = {};

    let folderProm = [];

    for (const folder of tableFolders) {
        folderProm.push(
            // eslint things that ScoreDocument[][] is some crazy variable declaration
            // weird.
            // eslint-disable-next-line no-loop-func
            folderCore.GetDataFromFolderQuery(folder, playtype, null, true).then(async (data) => {
                let [scores, uniqueScores, uniqueOnLamp]: ScoreDocument[][] = await Promise.all([
                    db.get("scores").find({
                        userID: userID,
                        chartID: { $in: data.charts.map((e) => e.chartID) },
                    }),
                    db.get("scores").find(
                        {
                            userID: userID,
                            chartID: { $in: data.charts.map((e) => e.chartID) },
                            isScorePB: true,
                        },
                        {
                            sort: { "scoreData.gradeIndex": 1 },
                        }
                    ),
                    db.get("scores").find(
                        {
                            userID: userID,
                            chartID: { $in: data.charts.map((e) => e.chartID) },
                            isLampPB: true,
                        },
                        {
                            sort: { "scoreData.lampIndex": 1 },
                        }
                    ),
                ]);

                if (!stats[folder.folderID]) {
                    stats[folder.folderID] = {};
                }

                let gradeDist: Record<string, number> = {};
                let lampDist: Record<string, number> = {};
                for (const sc of uniqueScores) {
                    if (gradeDist[sc.scoreData.grade]) {
                        gradeDist[sc.scoreData.grade] += 1;
                    } else {
                        gradeDist[sc.scoreData.grade] = 1;
                    }
                }
                for (const sc of uniqueOnLamp) {
                    if (lampDist[sc.scoreData.lamp]) {
                        lampDist[sc.scoreData.lamp] += 1;
                    } else {
                        lampDist[sc.scoreData.lamp] = 1;
                    }
                }

                stats[folder.folderID][playtype] = {
                    allScores: scores.length,
                    uniqueScores: uniqueScores.length,
                    totalCharts: data.charts.length,
                    lampDist: lampDist,
                    gradeDist: gradeDist,
                    gradeFolderLamp: null,
                    lampFolderLamp: null,
                };

                if (
                    uniqueScores.length === data.charts.length &&
                    uniqueScores.length + data.charts.length !== 0
                ) {
                    stats[folder.folderID][playtype]!.gradeFolderLamp =
                        uniqueScores[0].scoreData.grade;
                    stats[folder.folderID][playtype]!.lampFolderLamp =
                        uniqueOnLamp[0].scoreData.lamp;
                }
            })
        );
    }

    await Promise.all(folderProm);

    await db.get("folderdata-cache").insert({
        game: game,
        playtype: playtype,
        userID: userID,
        body: {
            folders: tableFolders,
            stats: stats,
            tableName,
        },
        validUntil: Date.now() + 8.64e7, // 24 hours
    });

    return res.status(201).json({
        success: true,
        description: "Successfully returned table data.",
        body: {
            folders: tableFolders,
            stats: stats,
            tableName,
        },
    });
});

// mounts
import folderIDRouter from "./folderID/folderID";

router.use("/:folderID", folderIDRouter);

export default router;
