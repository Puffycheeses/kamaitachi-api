const db = require("./db.js");
const express = require("express");
const middlewares = require("./middlewares.js");
const cookieParser = require('cookie-parser');

const app = express();
app.set("trust proxy", 1);

// allow cors requests from kamaitachi.xyz
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "https://kamaitachi.xyz");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

// prettyprint json for those in browsers who don't use chrome
// ffx comes with a great json viewer, but of course, chrome is BIG
// pls use ffx :).
app.set("json spaces", 4);

// crucial middleware; these are in this order for a very important reason.
app.use(cookieParser());

app.use(middlewares.RequireAPIKey);

app.use(middlewares.LogRequest);

app.use(middlewares.SanitiseInput);

// i think it's okay to mount this everywhere since it only mutates req.query, which should be uriencoded anyway.
// for all i know, express might do this by default, lol.
app.use(middlewares.DecodeURIComponents);

// just check the db lives
db.then(() => {
    console.log('Database loaded correctly in main.js');
});

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