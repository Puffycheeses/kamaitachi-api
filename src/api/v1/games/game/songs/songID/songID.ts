import * as express from "express";
const router = express.Router({ mergeParams: true });
import middlewares from "../../../../../../middlewares";

/**
 * @namespace /v1/games/:game/songs/:songID
 */

router.use(middlewares.RequireExistingSongID);

/**
 * Returns the song at the given ID.
 * @name GET /v1/games/:game/songs/:songID
 */
router.get("/", async (req, res) => {
    let song = req.song!;

    return res.status(200).json({
        success: true,
        description: `Found song ${song.title}.`,
        body: {
            item: song,
        },
    });
});

export default router;
