import db from "../db";

interface FolderQueryReturns {
    songs: SongDocument[];
    charts: ChartDocument[];
}

/**
 * GetDataFromFolderQuery: Retrieves charts and songs given a folderObject.
 * @param folder The folderObject to retrieve the charts of.
 * @param playtype A playtype to filter charts upon, can be null.
 * @param difficulty A difficulty to filter charts upon, can be null.
 * @param onlyGetCharts Only retrieves charts, this only works as intended for certain folderObjects
 */
async function GetDataFromFolderQuery(
    folder: FolderDocument,
    playtype: string,
    difficulty: string,
    onlyGetCharts?: boolean
): Promise<FolderQueryReturns> {
    let coll = folder.query.collection;

    if (coll === "charts") {
        coll = `charts-${folder.game}`;
        if (playtype) {
            folder.query.query.playtype = playtype;
        }
        if (difficulty) {
            folder.query.query.difficulty = difficulty;
        }
    } else if (coll === "songs") {
        coll = `songs-${folder.game}`;
    }

    let queryObj: Record<string, unknown> = {};

    for (const key in folder.query.query) {
        queryObj[key.replace(/¬/g, ".")] = folder.query.query[key];
    }

    if (folder.query.collection === "charts") {
        let charts: ChartDocument[] = (await db.get(coll).find(queryObj)) as ChartDocument[];

        let songs: SongDocument[] = [];

        if (!onlyGetCharts) {
            songs = (await db.get(`songs-${folder.game}`).find({
                id: { $in: charts.map((e) => e.id) },
            })) as SongDocument[];
        }

        return {
            songs: songs,
            charts: charts,
        };
    } else if (folder.query.collection === "songs") {
        let songs: SongDocument[] = (await db.get(coll).find(queryObj)) as SongDocument[];

        let chartQuery: Record<string, unknown> = {
            id: { $in: songs.map((e) => e.id) },
        };

        if (playtype) {
            chartQuery.playtype = playtype;
        }

        if (difficulty) {
            chartQuery.difficulty = difficulty;
        }

        let charts = (await db.get(`charts-${folder.game}`).find(chartQuery)) as ChartDocument[];

        return {
            songs: songs,
            charts: charts,
        };
    } else {
        throw new Error(`Unaccounted for collection of ${folder.query.collection}`);
    }
}

export { GetDataFromFolderQuery };
