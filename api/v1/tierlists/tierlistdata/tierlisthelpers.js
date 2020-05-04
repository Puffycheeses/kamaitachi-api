const db = require("../../../../db.js");
async function GetTierlistWithID(tierlistID){
    let tierlist = await db.get("tierlist").findOne({tierlistID}, {fields: {_id: 0}});

    return tierlist;
}

async function GetDefaultTierlist(game, playtype){
    let tierlist = await db.get("tierlist").findOne({game, playtype, isDefault: true}, {fields: {_id: 0}});

    return tierlist;
}

module.exports = {
    GetTierlistWithID,
    GetDefaultTierlist
}