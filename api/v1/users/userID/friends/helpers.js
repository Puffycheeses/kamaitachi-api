async function GetFriend(friendID){
    if (!friendID){
        return res.status(400).json({
            success: false,
            description: "No friendID provided."
        });
    }
    
    let friend = await userHelpers.GetUser(req.body.friendID);
    
    if (!friend){
        return res.status(400).json({
            success: false,
            description: "friendID '" + req.body.friendID + "' does not exist."
        });
    }

    return friend;
}

module.exports = {
    GetFriend
}