import db from "../../../db";
import * as express from "express";
const router = express.Router({ mergeParams: true });
import config from "../../../config/config";

/**
 * @namespace /v1/games
 */

interface GameStats {
    game: Game;
    playtypes: Playtypes[Game][];
    gameHuman: string;
    scoreCount: integer;
    songCount: integer;
    chartCount: integer;
}
interface GamesResponseCache {
    timestamp: integer;
    data: {
        gameStats: Partial<Record<Game, GameStats>>;
        totalScoreCount: integer;
        totalSongCount: integer;
        totalChartCount: integer;
    };
}

let gamesResponseCache: null | GamesResponseCache = null;
const ONE_HOUR = 1000 * 60 * 60;

router.get("/", async (req, res) => {
    if (gamesResponseCache && gamesResponseCache.timestamp + ONE_HOUR < Date.now()) {
        return res.status(200).json({
            success: true,
            description: "Retrieved v1/games cache.",
            body: gamesResponseCache.data,
        });
    }

    let gamesObj: Partial<Record<Game, GameStats>> = {};
    let totalScoreCount = 0;
    let totalSongCount = 0;
    let totalChartCount = 0;

    let scoresByGame = await db.get("scores").aggregate([
        {
            $group: {
                _id: "$game",
                count: { $sum: 1 },
            },
        },
    ]);

    let scoresGame: Record<string, integer> = {};

    for (const item of scoresByGame) {
        scoresGame[item._id] = item.count;
    }

    for (const game of config.supportedGames) {
        let scoreCount = scoresGame[game] || 0;
        let songCount = await db.get(`songs-${game}`).count({});
        let chartCount = await db.get(`charts-${game}`).count({});

        totalScoreCount += scoreCount;
        totalSongCount += songCount;
        totalChartCount += chartCount;

        let gameObj = {
            game: game,
            playtypes: config.validPlaytypes[game],
            gameHuman: config.gameHuman[game],
            scoreCount: scoreCount,
            songCount: songCount,
            chartCount: chartCount,
        };
        gamesObj[game] = gameObj;
    }

    gamesResponseCache = {
        timestamp: Date.now(),
        data: {
            gameStats: gamesObj,
            totalScoreCount,
            totalSongCount,
            totalChartCount,
        },
    };

    return res.status(201).json({
        success: true,
        description: `Kamaitachi is currently powering ${config.supportedGames.length} games.`,
        body: {
            gameStats: gamesObj,
            totalScoreCount,
            totalSongCount,
            totalChartCount,
        },
    });
});

// mounts
import gameRouter from "./game/game";

router.use("/:game", gameRouter);

export default router;
