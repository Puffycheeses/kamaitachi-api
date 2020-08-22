// fields that should not be exposed to the public for user returns.
const REMOVE_PRIVATE_USER_RETURNS = {_id:0, password: 0,email:0,integrations:0};

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
        highlight: "boolean"
    },
    "scores": {
        userID: "integer",
        songID: "integer",
        service: "string",
        game: "string",
        "scoreData.playtype": "string",
        "scoreData.difficulty": "string",
        "scoreData.grade": "string",
        "scoreData.lamp": "string",
        isScorePB: "boolean",
        isLampPB: "boolean",
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
        level: "string"
    },
    "clans": {
        clanID: "string",
        name: "string",
        motd: "string",
        founderID: "integer"
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
    "clans": ["xp","foundedTime"]
}

const defaultSorts = {
    "sessions": "timeEnded",
    "notifications": "timeSent",
    "imports": "timeEnded",
    "tierlistdata": "songID",
    "tierlist": "game",
    "songs": "id",
    "charts": "id",
    "clans": "xp"
}

const VALID_FOLDER_TYPES = ["levels","versions"];

const VALID_SONG_QUERY_KEYS = ["title","firstAppearance","artist","genre"];

module.exports = {
    REMOVE_PRIVATE_USER_RETURNS,
    TIME_DELTA_ONLINE,
    VALID_FOLDER_TYPES,
    VALID_SONG_QUERY_KEYS,
    validKeys,
    validSorts,
    defaultSorts
}