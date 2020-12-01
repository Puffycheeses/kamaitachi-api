// fields that should not be exposed to the public for user returns.
const REMOVE_PRIVATE_USER_RETURNS = {password: 0,email:0,integrations:0};

// required amount of time between a user last being seen for them to be considered "online".
// this is 5 minutes in miliseconds.
const TIME_DELTA_ONLINE = 300000

const validKeys = {
    "sessions": {
        name: "string",
        desc: "string",
        service: "string",
        game: "string",
        playtype: "string",
        userID: "integer",
        highlight: "boolean",
        timeStarted: "integer",
        timeEnded: "integer"
    },
    "folders": {
        name: "string",
        game: "string",
        custom: "boolean",
        meaningfulLamp: "boolean"
    },
    "scores": {
        userID: "integer",
        songID: "integer",
        service: "string",
        game: "string",
        "scoreData.playtype": "string",
        "scoreData.difficulty": "string",
        "scoreData.score": "float",
        "scoreData.percent": "float",
        "scoreData.grade": "string",
        "scoreData.lamp": "string",
        "scoreData.lampIndex": "integer",
        "scoreData.gradeIndex": "integer",
        "scoreData.esd": "float",
        isScorePB: "boolean",
        isLampPB: "boolean",
    },
    "queries": {
        name: "string",
        byUser: "integer"
    },
    "rivals": {
        name: "string",
        desc: "string",
        game: "string",
        playtype: "string",
        isDefault: "boolean",
        members: "integer",
        founderID: "integer",
        mutualGroup: "boolean"
    },
    "notifications": {
        title: "string",
        fromUserID: "integer",
        toUserID: "integer",
        read: "boolean",
        notifID: "string"
    },
    "imports": {
        userID: "integer",
        isNewImport: "boolean",
        importID: "string",
        service: "string",
        game: "string"
    },
    "tierlistdata": {
        tierlistID: "string",
        songID: "integer",
        difficulty: "string"
    },
    "tierlist": {
        tierlistID: "string",
        default: "boolean",
        game: "string",
        playtype: "string"
    },
    "songs": {
        id: "integer",
        artist: "string",
        title: "string",
        genre: "string"
    },
    "charts": {
        id: "integer",
        difficulty: "string",
        playtype: "string",
        level: "string",
        chartID: "string",
        "notedata.notecount": "integer",
        "internals.hash": "string",
        "internals.hashSHA256": "string"
    },
    "clans": {
        clanID: "string",
        name: "string",
        motd: "string",
        founderID: "integer"
    },
    "goals": {
        goalID: "string",
        createdBy: "integer",
        title: "string",
        game: "string",
        playtype: "string",
        timeAdded: "float",
        directChartID: "string"
    },
    "user-goals": {
        goalID: "string",
        userID: "integer",
        timeSet: "float",
        timeAchieved: "float",
        achieved: "boolean",
        game: "string",
        playtype: "string"
    },
    "user-milestones": {
        milestoneID: "string",
        userID: "integer",
        timeSet: "float",
        timeAchieved: "float",
        achieved: "boolean",
        game: "string",
        playtype: "string"
    },
    "milestones": {
        milestoneID: "string",
        createdBy: "integer",
        game: "string",
        playtype: "string",
        title: "string",
        users: "integer", // smart mongo array stuff!
    }
}

const validSorts = {
    "sessions": ["timeEnded", "timeStarted", "performance", "timestamp"],
    "notifications": ["timeSent"],
    "imports": ["timeEnded","timeStarted"],
    "tierlistdata": ["songID"],
    "tierlist": ["game"],
    "songs": ["id","title","artist","genre"],
    "charts": ["id","level","notedata.notecount"],
    "clans": ["xp","foundedTime"],
    "scores": ["timeAchieved","timeAdded","xp","scoreData.percent","scoreData.score","scoreData.lampIndex","scoreData.gradeIndex", "calculatedData.rating","calculatedData.notability", "calculatedData.lampRating", "calculatedData.gameSpecific.BPI", "calculatedData.gameSpecific.EPI"],
    "queries": ["timeAdded"],
    "folders": ["views"],
    "goals": ["timeAdded"],
    "user-goals": ["timeSet", "timeAchieved"],
    "user-milestones": ["timeSet", "timeAchieved"]
}

const defaultSorts = {
    "sessions": "timeEnded",
    "goals": "timeAdded",
    "notifications": "timeSent",
    "imports": "timeEnded",
    "tierlistdata": "songID",
    "tierlist": "game",
    "songs": "id",
    "charts": "id",
    "clans": "xp",
    "scores": "timeAchieved",
    "queries": "timeAdded",
    "folders": "views", // temp
    "user-goals": "timeSet",
    "user-milestones": "timeSet",
}

// deprecated
const VALID_FOLDER_TYPES = ["levels","versions"];

module.exports = {
    REMOVE_PRIVATE_USER_RETURNS,
    TIME_DELTA_ONLINE,
    VALID_FOLDER_TYPES,
    validKeys,
    validSorts,
    defaultSorts
}