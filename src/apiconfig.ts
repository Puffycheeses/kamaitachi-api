// fields that should not be exposed to the public for user returns.
const REMOVE_PRIVATE_USER_RETURNS: Record<string, 0 | 1> = {
    password: 0,
    email: 0,
    integrations: 0,
};

// required amount of time between a user last being seen for them to be considered "online".
// this is 5 minutes in miliseconds.
const TIME_DELTA_ONLINE = 300000;

const validKeys: Record<ValidFQDatabases, Record<string, FQType>> = {
    users: {
        username: "string",
        displayname: "string",
        id: "integer",
        lastSeen: "integer",
        about: "string",
        custompfp: "boolean",
        custombanner: "boolean",
        clan: "string",
    },
    sessions: {
        name: "string",
        desc: "string",
        service: "string",
        game: "string",
        playtype: "string",
        userID: "integer",
        highlight: "boolean",
        timeStarted: "integer",
        timeEnded: "integer",
        performance: "float",
        lampPerformance: "float",
        scorePerformance: "float",
    },
    folders: {
        name: "string",
        game: "string",
        views: "integer",
        table: "string",
    },
    scores: {
        service: "string",
        userID: "integer",
        songID: "integer",
        chartID: "string",
        game: "string",
        "scoreData.playtype": "string",
        "scoreData.difficulty": "string",
        "scoreData.score": "float",
        "scoreData.percent": "float",
        "scoreData.grade": "string",
        "scoreData.lamp": "string",
        "scoreData.lampIndex": "integer",
        "scoreData.gradeIndex": "integer",
        "calculatedData.rating": "float",
        "calculatedData.lampRating": "float",
        "calculatedData.ranking": "integer",
        "calculatedData.outOf": "integer",
        isScorePB: "boolean",
        isLampPB: "boolean",
        xp: "integer",
        timeAchieved: "integer",
        comment: "string",
        timeAdded: "integer",
    },
    queries: {
        name: "string",
        desc: "string",
        byUser: "integer",
        timeAdded: "integer",
        timesUsed: "integer",
        forDatabase: "string",
    },
    rivals: {
        name: "string",
        desc: "string",
        game: "string",
        playtype: "string",
        isDefault: "boolean",
        members: "integer",
        founderID: "integer",
        mutualGroup: "boolean",
    },
    notifications: {
        title: "string",
        fromUserID: "integer",
        toUserID: "integer", // hack, this is overrode whenever the query engine is called.
        read: "boolean",
        notifID: "string",
        timeSent: "integer",
    },
    imports: {
        userID: "integer",
        importID: "string",
        service: "string",
        game: "string",
        timeTaken: "float",
        msPerScore: "float",
        skippedScores: "integer",
        successfulScores: "integer",
        timeStarted: "integer",
        timeEnded: "integer",
    },
    tierlistdata: {
        tierlistID: "string",
        songID: "integer",
        difficulty: "string",
    },
    tierlist: {
        tierlistID: "string",
        default: "boolean",
        game: "string",
        playtype: "string",
        title: "string",
    },
    songs: {
        id: "integer",
        artist: "string",
        title: "string",
        genre: "string",
        "internals.songHash": "string",
        firstAppearance: "string",
    },
    charts: {
        id: "integer",
        difficulty: "string",
        playtype: "string",
        level: "string",
        levelNum: "float",
        chartID: "string",
        "notedata.notecount": "integer",
        "internals.hash": "string",
        "internals.hashSHA256": "string",
        bpmMin: "float",
        bpmMax: "float",
    },
    goals: {
        goalID: "string",
        createdBy: "integer",
        title: "string",
        game: "string",
        playtype: "string",
        timeAdded: "float",
        directChartID: "string",
    },
    "user-goals": {
        goalID: "string",
        userID: "integer",
        timeSet: "float",
        timeAchieved: "float",
        achieved: "boolean",
        game: "string",
        playtype: "string",
    },
    "user-milestones": {
        milestoneID: "string",
        userID: "integer",
        timeSet: "float",
        timeAchieved: "float",
        achieved: "boolean",
        game: "string",
        playtype: "string",
    },
    milestones: {
        milestoneID: "string",
        createdBy: "integer",
        game: "string",
        playtype: "string",
        title: "string",
        group: "string",
    },
};

const validSorts: Record<ValidFQDatabases, string[]> = {
    users: ["id", "lastSeen"],
    sessions: ["timeEnded", "timeStarted", "performance", "lampPerformance", "scorePerformance"],
    notifications: ["timeSent"],
    imports: [
        "timeEnded",
        "timeStarted",
        "timeTaken",
        "msPerScore",
        "skippedScores",
        "successfulScores",
    ],
    tierlistdata: [],
    tierlist: [],
    songs: ["id"],
    charts: ["id", "levelNum", "notedata.notecount"],
    scores: [
        "timeAchieved",
        "timeAdded",
        "xp",
        "scoreData.percent",
        "scoreData.score",
        "scoreData.lampIndex",
        "scoreData.gradeIndex",
        "calculatedData.rating",
        "calculatedData.ranking",
        "calculatedData.lampRating",
    ],
    queries: ["timeAdded"],
    folders: ["views"],
    goals: ["timeAdded"],
    "user-goals": ["timeSet", "timeAchieved"],
    "user-milestones": ["timeSet", "timeAchieved"],
    rivals: [],
    milestones: [],
};

const defaultSorts: Record<ValidFQDatabases, string | null> = {
    users: "lastSeen",
    sessions: "timeEnded",
    goals: "timeAdded",
    notifications: "timeSent",
    imports: "timeEnded",
    tierlistdata: null,
    tierlist: null,
    songs: "id",
    charts: "id",
    scores: "timeAchieved",
    queries: "timeAdded",
    folders: "views", // temp
    "user-goals": "timeSet",
    "user-milestones": "timeSet",
    milestones: null,
    rivals: null,
};

// deprecated
const VALID_FOLDER_TYPES = ["levels", "versions"];

export default {
    REMOVE_PRIVATE_USER_RETURNS,
    TIME_DELTA_ONLINE,
    VALID_FOLDER_TYPES,
    validKeys,
    validSorts,
    defaultSorts,
};
