const db = require("../../../../../../db.js");

// cannot be refactored into fancydbquery due to weird level/version specifities

async function GetFolderInfo(query, params){
    let folderCharts = [];
    let folderSongs = [];

    let chartQueryObj = {}

    if (query.playtype){
        if (!config.validPlaytypes[params.game].includes(query.playtype)){
            return {success: false, description: "This playtype is unsupported", statusCode: 400};
        }
        chartQueryObj.playtype = query.playtype
    }

    if (query.difficulty){
        chartQueryObj.difficulty = query.difficulty;
    }

    if (params.folderType === "levels"){
        chartQueryObj.level = params.folderName;

        folderCharts = await db.get("charts-" + params.game).find(chartQueryObj, {fields: {_id: 0}});

        let folderSongIDs = [...new Set(folderCharts.map(e => e.id))];

        folderSongs = await db.get("songs-" + params.game).find({id: {$in: folderSongIDs}})
    }
    else if (params.folderType === "versions"){
        folderSongs = await db.get("songs-" + params.game).find({firstAppearance: params.folderName}, {fields: {_id: 0}});
        let folderSongIDs = folderSongs.map(e => e.id);

        chartQueryObj.id = {$in: folderSongIDs};

        folderCharts = await db.get("charts-" + params.game).find(chartQueryObj, {fields: {_id: 0}});
    }
    else {
        return {success: false, description: "Fatal error in grabbing folder.", statusCode: 500};
    }

    return {success: true, folderCharts,folderSongs}
}

module.exports = {
    GetFolderInfo
}