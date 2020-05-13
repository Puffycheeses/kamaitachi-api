const db = require("./db.js");
const Sanitise = require("mongo-sanitize"); // sanitise
const userHelpers = require("./helpers/userhelpers.js");
const apiConfig = require("./apiconfig.js");
const config = require("./config/config.js");

async function RequireAPIKey(req,res,next)
{
    let givenKey;
    if (req.query.key){
        givenKey = req.query.key;
    }
    else {
        givenKey = req.cookies.apikey;
    }
    
    let key = await db.get("public-api-keys").findOne({apiKey: givenKey});

    if (!key || key.expireTime < Date.now()){
        return res.status(401).json({
            success: false,
            description: "Unauthorised."
        });
    }

    next();
}

async function RequireExistingUser(req,res,next){
    let user = await userHelpers.GetUser(req.params.userID);
    if (!user){
        return res.status(404).json({
            success: false,
            description: "Can not find user '" + req.params.userID + "'."
        });
    }
    next();
}

async function RequireExistingSongID(req,res,next){
    let song = await db.get("songs-" + req.params.game).findOne({id: parseInt(req.params.songID)});
    if (!song){
        return res.status(404).json({
            success: false,
            description: "Can not find songID " + req.params.songID + "."
        });
    }

    next();
}

async function RequireUserKeyMatch(req,res,next){
    let user = await userHelpers.GetUser(req.params.userID);
    let key = await db.get("public-api-keys").findOne({apiKey: req.query.key});

    if (user.id !== key.assignedTo){
        return res.status(401).json({
            success: false,
            description: "This key is not authorised to modify user '" + user.id + "'"
        })
    }

    next();
}

async function LogRequest(req,res,next){
    let requestObj = {}
    let key = await db.get("public-api-keys").findOne({apiKey: req.query.key});

    requestObj.key = key;
    requestObj.location = req.originalURI;
    requestObj.timestamp = Date.now();
    requestObj.ip = req.ip;

    await db.get("public-api-requests").insert(requestObj);
    next();
}

async function MaintenanceMode(req,res,next){
    try{
        let key = await db.get("public-api-keys").findOne({apiKey: req.query.key});
        if (!key.permissions.admin){
            return res.status(500).json({
                success: false,
                description: "Kamaitachi's API is currently in maintenance mode. It will be back up soon! You can join the discord to keep up with updates on server status: https://discord.gg/9B8xm4h. Apologies for the inconvenience."
            });
        }
    }
    catch(e){
        console.log(e);
        return res.status(500).json({
            success: false,
            description: "Kamaitachi's API is currently in maintenance mode. It will be back up soon! You can join the discord to keep up with updates on server status: https://discord.gg/9B8xm4h. Apologies for the inconvenience."
        });
    }

    next();
}

// try and not get injected
async function SanitiseInput(req,res,next){
    Sanitise(req.query);
    for (const key in req.query) {
        if (typeof req.query[key] === "object" && req.query[key]) {
            return res.status(400).json({
                success: false,
                description: "Passed data was determined to be malicious. Nesting objects is not allowed."
            });
        }
    }

    Sanitise(req.body);
    for (const key in req.body) {
        if (typeof req.body[key] === "object" && req.body[key]) {
            return res.status(400).json({
                success: false,
                description: "Passed data was determined to be malicious. Nesting objects is not allowed."
            });
        }
    }

    next();
}

async function DecodeURIComponents(req,res,next){
    // for every key in the query decode it.
    if (req.query && typeof req.query === 'object'){
        for (const key in req.query) {
            if (req.query.hasOwnProperty(key)) {
                req.query[key] = decodeURIComponent(req.query[key]);
            }
        }
    }

    next();
}

async function RequireValidFolderType(req,res,next){
    if (!apiConfig.VALID_FOLDER_TYPES.includes(req.params.folderType)){
        return res.status(400).json({
            success: false,
            description: "This folderType is unsupported."
        });
    }

    next();
}

async function RequireExistingFolderName(req,res,next){
    if (!config.folders[req.params.game][req.params.folderType].includes(req.params.folderName)){
        return res.status(400).json({
            success: false,
            description: "This folderName does not exist in this folderType."
        });
    }

    next();
}

async function RequireExistingClan(req,res,next){
    let clan = await db.get("clans").findOne({clanID: req.params.clanID});
    if (!clan){
        return res.status(404).json({
            success: false,
            description: "This clan does not exist."
        });
    }
    next();
}

async function RequireInClan(req,res,next){
    let clan = await db.get("clans").findOne({clanID: req.params.clanID});
    if (!clan){
        return res.status(500).json({
            success: false,
            description: "This clan has been deleted while processing your request."
        });
    }

    let key = await db.get("public-api-keys").findOne({apiKey: req.query.key});

    let memberList = clan.members.map(e => e.userID);

    if (!memberList.includes(key.assignedTo)){
        return res.status(401).json({
            success: false,
            description: "You are not a member of this clan"
        });
    }

    next();
}

async function RequireClanAdmin(req,res,next){
    let clan = await db.get("clans").findOne({clanID: req.params.clanID});
    if (!clan){
        return res.status(500).json({
            success: false,
            description: "This clan has been deleted while processing your request."
        });
    }

    let key = await db.get("public-api-keys").findOne({apiKey: req.query.key});
    
    
    let isClanAdmin = key.assignedTo === clan.founderID;

    if (!isClanAdmin){
        for (const member of clan.members) {
            if (key.assignedTo === member.userID && "admin" === member.status){
                isClanAdmin = true;
                break;
            }
        }
    }


    if (!isClanAdmin){
        return res.status(401).json({
            success: false,
            description: "You are not an administrator or founder of this clan."
        })
    }

    next();
}

async function RequireClanFounder(req,res,next){
    let clan = await db.get("clans").findOne({clanID: req.params.clanID});
    if (!clan){
        return res.status(500).json({
            success: false,
            description: "This clan has been deleted while processing your request."
        });
    }

    let key = await db.get("public-api-keys").findOne({apiKey: req.query.key});
    if (key.assignedTo !== clan.founderID){
        return res.status(401).json({
            success: false,
            description: "You are not the clan founder."
        })
    }

    next();
}

async function InvitedToClan(req,res,next){
    let clan = await db.get("clans").findOne({clanID: req.params.clanID});
    if (!clan){
        return res.status(500).json({
            success: false,
            description: "This clan has been deleted while processing your request."
        });
    }

    let key = await db.get("public-api-keys").findOne({apiKey: req.query.key});
    if (!clan.outgoingInvites.includes(key.assignedTo)){
        return res.status(401).json({
            success: false,
            description: "You are not invited to this clan."
        });
    }

    next();
}

async function RequireValidGame(req,res,next){
    if (!config.supportedGames.includes(req.params.game)){
        return res.status(400).json({
            success: false,
            description: "This game is not supported."
        });
    }
    next();
}

module.exports = {
    SanitiseInput,
    MaintenanceMode,
    DecodeURIComponents,
    LogRequest,
    RequireAPIKey,
    RequireExistingUser,
    RequireUserKeyMatch,
    RequireValidFolderType,
    RequireExistingFolderName,
    RequireExistingSongID,
    RequireExistingClan,
    RequireClanAdmin,
    RequireInClan,
    RequireClanFounder,
    InvitedToClan,
    RequireValidGame
};
