const db = require("../../../../db.js");
async function GetTierlistWithID(tierlistID){
    let tierlist = await db.get("tierlist").findOne({tierlistID}, {projection: {_id: 0}});

    return tierlist;
}

async function GetDefaultTierlist(game, playtype){
    let tierlist = await db.get("tierlist").findOne({game, playtype, isDefault: true}, {projection: {_id: 0}});

    return tierlist;
}

module.exports = {
    GetTierlistWithID,
    GetDefaultTierlist
}