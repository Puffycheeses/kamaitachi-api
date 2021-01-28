import db from "../db";
import userCore from "./user-core";

async function AutoCoerce(scores: Array<ScoreDocument>): Promise<Array<ScoreDocument>> {
    let notPBsArr = [];

    for (const s of scores) {
        if (!s.isLampPB) {
            notPBsArr.push({
                userID: s.userID,
                chartID: s.chartID,
                isLampPB: true,
            });
        }
    }
    if (notPBsArr.length === 0) {
        return scores;
    }

    let lampPBsArr = await db.get("scores").find({
        $or: notPBsArr,
    });

    let lampPBs = new Map();
    for (const score of lampPBsArr) {
        lampPBs.set(`${score.userID}-${score.chartID}`, score);
    }

    for (const score of scores) {
        if (!score.isLampPB) {
            let lampPB = lampPBs.get(`${score.userID}-${score.chartID}`);

            if (lampPB) {
                score.scoreData.lamp = lampPB.scoreData.lamp;
                score.scoreData.lampIndex = lampPB.scoreData.lampIndex;
                score.calculatedData.lampRating = lampPB.calculatedData.lampRating;
                if (score.game === "bms") {
                    score.calculatedData.rating = lampPB.calculatedData.rating;
                }
                score.isLampPB = true;
            }
        }
    }

    return scores;
}

/**
 * Score Associated Data: including the relevant chart and song.
 */
interface ScoreAssocData {
    items: ScoreDocument[];
    charts: Partial<Record<Game, ChartDocument[]>>;
    songs: Partial<Record<Game, SongDocument[]>>;
    users?: PublicUserDocument[];
}

/**
 * Takes the body of a score-fancyquery and returns
 * appended charts, song and user data.
 * @param scoreBody
 */
async function GetAssocData(fqr: FancyQueryBody<ScoreDocument>): Promise<ScoreAssocData> {
    let chartQuery: Partial<Record<Game, string[]>> = {};
    let songQuery: Partial<Record<Game, number[]>> = {};

    let scoreBody: ScoreAssocData = {
        items: fqr.items,
        charts: {},
        songs: {},
        users: [],
    };

    for (const e of scoreBody.items) {
        if (!chartQuery[e.game]) {
            songQuery[e.game] = [];
            chartQuery[e.game] = [];
        }

        // The following two things *are* always defined, typescript just doesn't seem
        // to appreciate it.
        // the ?. is to shut it up.
        chartQuery[e.game]?.push(e.chartID);
        songQuery[e.game]?.push(e.songID);
    }

    let chartRet: Partial<Record<Game, ChartDocument[]>> = {};
    let songsRet: Partial<Record<Game, SongDocument[]>> = {};

    for (const k in songQuery) {
        // ts is drunk and needs this assertion made for it.
        let key: Game = k as Game;

        let charts = await db.get(`charts-${key}`).find(
            {
                $in: chartQuery[key],
            },
            {
                projection: { _id: 0 },
            }
        );
        let songs = await db.get(`songs-${key}`).find(
            {
                id: { $in: songQuery[key] },
            },
            {
                projection: { _id: 0 },
            }
        );

        songsRet[key] = songs;
        chartRet[key] = charts;
    }

    let users = await userCore.GetUsers(scoreBody.items.map((e) => e.userID));

    scoreBody.charts = chartRet;
    scoreBody.songs = songsRet;
    scoreBody.users = users;

    return scoreBody;
}

export default { GetAssocData, AutoCoerce };
