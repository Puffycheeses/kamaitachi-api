import db from "../db";

async function HandleCustomUserSelections(
    req: KTRequest,
    queryObj: Record<string, unknown>
): Promise<Record<string, unknown>> {
    if (req.query.customUserSelection === "rivals" && req.user) {
        let rivalGroups = await db.get("rivals").find({
            isDefault: true,
            founderID: req.user.id,
        });

        if (rivalGroups.length) {
            return {
                $or: rivalGroups.map((e) => ({
                    userID: { $in: e.members.filter((m: integer) => m !== req.user?.id) },
                    game: e.game,
                    playtype: e.playtype,
                })),
            };
        } else {
            throw {
                statusCode: 400,
                body: {
                    success: false,
                    description: "No rival groups set up.",
                },
            };
        }
    } else if (req.query.customUserSelection === "friends" && req.user) {
        queryObj.userID = { $in: req.user.friends };
    }

    return queryObj;
}

export default { HandleCustomUserSelections };
