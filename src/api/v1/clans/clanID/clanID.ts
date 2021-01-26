import db from "../../../../db.js";
import middlewares = require("../../../../middlewares.js");
import * as express from "express";
const router = express.Router({ mergeParams: true });
import dbCore = require("../../../../core/db-core.js");

// mounted on /api/v1/clans/:clanID
router.use(middlewares.RequireExistingClan);

router.get("/", async function (req, res) {
    let clan = await db.get("clans").findOne({ clanID: req.params.clanID });

    if (!clan) {
        return res.status(500).json({
            success: false,
            description: "The clan has been deleted while processing.",
        });
    }

    return res.status(200).json({
        success: true,
        description: `Found clan ${clan.name} [${clan.clanID}].`,
        body: {
            item: clan,
        },
    });
});

// in progress
router.patch("/invite", middlewares.RequireClanAdmin, async function (req, res) {});

router.patch("/join", middlewares.InvitedToClan, async function (req, res) {
    let clan = await db.get("clans").findOne({ clanID: req.params.clanID });

    if (!clan) {
        return res.status(500).json({
            success: false,
            description: "The clan has been deleted while processing your request.",
        });
    }

    let key = await db.get("public-api-keys").findOne({ key: req.query.key });

    let user = await db.get("users").findOne({ id: key.assignedTo });

    if (user.clan) {
        return res.status(400).json({
            success: false,
            description: "You are already in a clan.",
        });
    }

    let clanMemberIDs = clan.members.map((e) => e.userID);
    if (clanMemberIDs.includes(req.session.userID)) {
        return res.status(400).json({
            success: false,
            description: "You are already in this clan.",
        });
    }

    // all good
    await db.get("users").update({ _id: user._id }, { $set: { clan: clan.clanID } });

    clan.outgoingInvites.splice(clan.outgoingInvites.indexOf(joiner.id), 1);

    clan.members.push({ userID: joiner.id, joinTime: Date.now(), status: "Member" });
    await db.get("clans").update({ _id: clan._id }, { $set: clan });

    await db.get("notifications").insert({
        title: `${user.username} Joined the clan!`,
        body: `${user.username} Has joined your clan!`,
        timeSent: Date.now(),
        read: false,
        toUserID: clan.founderID,
        fromUserID: user.userID,
        type: "message",
        notifID: crypto.createHash("sha1").update(`${Date.now()}message`).digest("hex"),
        data: {},
    });

    // async but dont care
    clanHelpers.UpdateClanXP(clan.clanID);
    return res.status(200).json({
        success: true,
        description: "Successfully joined clan.",
        body: {
            clanID: clan.clanID,
        },
    });
});

router.delete("/disband", middlewares.RequireClanFounder, async function (req, res) {
    let clan = await db.get("clans").findOne({ clanID: req.params.clanID });

    if (!clan) {
        return res.status(500).json({
            success: false,
            description: "The clan has been deleted while processing.",
        });
    }
    // danger zone //
    await db.get("clans").remove({ _id: clan._id });

    // remove all references to this clan from all of its members
    for (const member of clan.members) {
        await db.get("users").update({ id: member.userID }, { $unset: { clan: 1 } });
        // letem know
        await db.get("notifications").insert({
            title: "Clan disbanded",
            body: `Your clan, ${clan.name} has been disbanded :(.`,
            timeSent: Date.now(),
            read: false,
            toUserID: member.userID,
            fromUserID: clan.founderID,
            type: "clandisband",
            notifID: crypto.createHash("sha1").update(`${Date.now()}clandisband`).digest("hex"),
            data: {},
        });
    }

    return res.status(200).json({
        success: true,
        description: `Successfully destroyed clan ${clan.clanID}.`,
        body: {
            deletedClanID: clan.clanID,
        },
    });
});

// stop copy pasting - zkldi
// (TODO)
router.patch("/change-motd", middlewares.RequireClanAdmin, async function (req, res) {
    if (!req.query.motd) {
        return res.status(400).json({
            success: false,
            description: "No motd has been passed!",
        });
    }

    let clan = await db.get("clans").findOne({ clanID: req.params.clanID });

    if (!clan) {
        return res.status(500).json({
            success: false,
            description: "The clan has been deleted while processing your request.",
        });
    }

    await db.get("clans").update({ _id: clan._id }, { $set: { motd: req.query.motd } });

    return res.status(200).json({
        success: true,
        description: `Clan motd has been changed from ${clan.motd} to ${req.query.motd}`,
        body: {
            oldMotd: clan.motd,
            newMotd: req.query.motd,
        },
    });
});

router.patch("/change-name", middlewares.RequireClanAdmin, async function (req, res) {
    if (!req.query.name) {
        return res.status(400).json({
            success: false,
            description: "No name has been passed!",
        });
    }

    let clan = await db.get("clans").findOne({ clanID: req.params.clanID });

    if (!clan) {
        return res.status(500).json({
            success: false,
            description: "The clan has been deleted while processing.",
        });
    }

    await db.get("clans").update({ _id: clan._id }, { $set: { name: req.query.name } });

    return res.status(200).json({
        success: true,
        description: `Clan name has been changed from ${clan.name} to ${req.query.name}`,
        body: {
            oldName: clan.name,
            newName: req.query.name,
        },
    });
});

module.exports = router;
