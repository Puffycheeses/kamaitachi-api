const db = require("./db.js");
const express = require("express");
const middlewares = require("./middlewares.js");
const cookieParser = require('cookie-parser');

const app = express();
app.set("trust proxy", 1);

process.env.NODE_ENV = process.env.NODE_ENV || "production";

// allow cors requests from kamaitachi.xyz
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", process.env.NODE_ENV === "production" ? "https://kamaitachi.xyz" : "http://127.0.0.1:8080");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
    next();
});

console.log(`
    ██╗  ██╗ █████╗ ███╗   ███╗ █████╗ ██╗████████╗ █████╗  ██████╗██╗  ██╗██╗     ██╗ █████╗ ██████╗ ██╗██╗ 
    ██║ ██╔╝██╔══██╗████╗ ████║██╔══██╗██║╚══██╔══╝██╔══██╗██╔════╝██║  ██║██║    ██╔╝██╔══██╗██╔══██╗██║╚██╗
    █████╔╝ ███████║██╔████╔██║███████║██║   ██║   ███████║██║     ███████║██║    ██║ ███████║██████╔╝██║ ██║
    ██╔═██╗ ██╔══██║██║╚██╔╝██║██╔══██║██║   ██║   ██╔══██║██║     ██╔══██║██║    ██║ ██╔══██║██╔═══╝ ██║ ██║
    ██║  ██╗██║  ██║██║ ╚═╝ ██║██║  ██║██║   ██║   ██║  ██║╚██████╗██║  ██║██║    ╚██╗██║  ██║██║     ██║██╔╝
    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝
`)

console.log("Running in env: " + process.env.NODE_ENV);

// hack fix for cors preflight
// in order to send CORS requests with methods other than GET or POST
// an OPTIONS request to the same endpoint must return EXACTLY
// an empty 200 response.

// since we don't use OPTIONS for anything, we can just hack around this
// and always return an empty 200 - even if that request is completely invalid.
app.use((req,res, next) => {;
    if (req.method === "OPTIONS"){
        res.header("Access-Control-Max-Age", 60 * 60 * 24 * 365);
        return res.status(200).send();
    }
    next();
});

// prettyprint json for those in browsers who don't use chrome
// ffx comes with a great json viewer, but of course, chrome is BIG
// pls use ffx :).
app.set("json spaces", 4);

// enable reading json bodies
// limit them so as not to choke the api
app.use(express.json({limit:"1mb"}));

// crucial middleware; these are in this order for a very important reason.
app.use(cookieParser());

app.use(middlewares.RequireAPIKey);

app.use(middlewares.LogRequest);

app.use(middlewares.SanitiseInput);

// i think it's okay to mount this everywhere since it only mutates req.query, which should be uriencoded anyway.
// for all i know, express might do this by default, lol.
app.use(middlewares.DecodeURIComponents);


// mounts
const apiRouterV1 = require("./api/v1/main.js");
app.use("/v1", apiRouterV1)

// if anything has not been found by this point, they're 404ing.
app.get('*', async function(req, res){
    return res.status(404).json({
        success: false,
        description: "404: Endpoint does not exist."
    });
});

module.exports = app;