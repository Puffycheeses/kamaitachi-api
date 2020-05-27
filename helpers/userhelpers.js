const db = require("../db.js");
const apiConfig = require("../apiconfig.js");

// finds the user on userID or username.
// determines this by checking if input is a string
// note that names starting with numbers are forbidden in kamai, so this is all good.
// default case is to return null.
async function GetUser(userID){
    let user = null;
    let intUserID = parseInt(userID);
    if(isNaN(intUserID) || intUserID < 0){
        // user handle has been passed
        // use regex to ensure case insensitivity
        user = await db.get("users").findOne({username: new RegExp(`^${userID}$`, 'i')}, {fields:apiConfig.REMOVE_PRIVATE_USER_RETURNS});
    }
    else {
        user = await db.get("users").findOne({id: intUserID}, {fields:apiConfig.REMOVE_PRIVATE_USER_RETURNS});
    }
    return user;
}

async function GetUsers(userIDs){
    let users = await db.get("users").find({id: {$in: userIDs}}, {fields:apiConfig.REMOVE_PRIVATE_USER_RETURNS});

    return users;
}

async function GetUserWithAPIKey(aKey){
    let apiKey = await db.get("public-api-keys").findOne({apiKey: aKey});

    if (!apiKey){
        console.error("apiKey removed during query.", aKey);
        return null;
    }

    let user = await db.get("users").findOne({id: apiKey.assignedTo});

    if (!user){
        console.error("FATAL. KEY ASSIGNED TO USER WHO DOES NOT EXIST", aKey);
        return null;
    }

    return user;
}

async function GetAllUsers(){
    let users = await db.get("users").find({}, {fields: apiConfig.REMOVE_PRIVATE_USER_RETURNS});
    return users;
}

async function GetPlayersOnGame(game, playtype){
    let users = await GetAllUsers();

    let Criteria = e => e.ratings[game] && Object.keys(e.ratings[game]).length > 0;
    if (playtype){
        Criteria = e => e.ratings[game] && e.ratings[game][playtype];
    }
    users = users.filter(Criteria);

    return users;
}

// returns true/false, as expected
async function IsUserIDOnline(userID){
    let user = await GetUser(userID);
    return Date.now() - user.lastSeen > apiConfig.TIME_DELTA_ONLINE;
}

module.exports = {
    GetUser,
    GetAllUsers,
    IsUserIDOnline,
    GetPlayersOnGame,
    GetUserWithAPIKey,
    GetUsers
}