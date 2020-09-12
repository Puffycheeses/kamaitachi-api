const db = require("../db.js");

// originally, folder queries were way more powerful.
// but it was a lot of work, for something nobody would ever care about.
// apologies.
async function GetDataFromFolderQuery(folder, playtype, difficulty, onlyGetCharts){
    let coll = folder.query.collection;

    if (coll === "charts"){
        coll = "charts-" + folder.game;
        if (playtype){
            folder.query.query.playtype = playtype;
        }
        if (difficulty){
            folder.query.query.difficulty = difficulty;
        }
    }
    else if (coll === "songs"){
        coll = "songs-" + folder.game;
    }

    let queryObj = {};

    for (const key in folder.query.query) {
        queryObj[key.replace(/¬/g, ".")] = folder.query.query[key];
    }

    let r = await db.get(coll).find(queryObj);

    if (folder.query.collection === "charts"){
        let songs = [];
        
        if (!onlyGetCharts){
            songs = await db.get("songs-" + folder.game).find({
                id: {$in: r.map(e => e.id)}
            });
        }

        return {
            songs: songs,
            charts: r,
        }
    }
    else if (folder.query.collection === "songs"){
        let chartQuery = {
            id: {$in: r.map(e => e.id)},
        };

        if (playtype){
            chartQuery.playtype = playtype;
        }

        let charts = await db.get("charts-" + folder.game).find(chartQuery);

        return {
            songs: r,
            charts: charts
        }
    }
}

module.exports = {
    GetDataFromFolderQuery
}