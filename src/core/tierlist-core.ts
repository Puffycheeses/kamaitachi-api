import db from "../db";
async function GetTierlistWithID(tierlistID: string): Promise<TierlistDocument> {
    let tierlist = await db.get("tierlist").findOne({ tierlistID }, { projection: { _id: 0 } });

    return tierlist;
}

async function GetDefaultTierlist(
    game: Game,
    playtype: Playtypes[Game]
): Promise<TierlistDocument> {
    let tierlist = await db
        .get("tierlist")
        .findOne({ game, playtype, isDefault: true }, { projection: { _id: 0 } });

    return tierlist;
}

export default { GetTierlistWithID, GetDefaultTierlist };
