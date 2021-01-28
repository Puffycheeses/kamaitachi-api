import { Request, Response, NextFunction, default as express } from "express";
import middlewares from "./middlewares";
import { default as cookieParser } from "cookie-parser";

const app = express();
app.set("trust proxy", 1);

process.env.NODE_ENV = process.env.NODE_ENV || "production";

// allow cors requests from kamaitachi.xyz
app.use((req: Request, res: Response, next: NextFunction) => {
    res.header(
        "Access-Control-Allow-Origin",
        process.env.NODE_ENV === "production" ? "https://kamaitachi.xyz" : "http://127.0.0.1:8080"
    );
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
    next();
});

app.set("query parser", "simple");

// taken from https://nodejs.org/api/process.html#process_event_unhandledrejection
// to avoid future deprecation.
process.on("unhandledRejection", (reason, promise) => {
    console.log("Unhandled Rejection at:", promise, "reason:", reason);
});

// hack fix for cors preflight
// in order to send CORS requests with methods other than GET or POST
// an OPTIONS request to the same endpoint must return EXACTLY
// an empty 200 response.

// since we don't use OPTIONS for anything, we can just hack around this
// and always return an empty 200 - even if that request is completely invalid.
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Max-Age", (60 * 60 * 24 * 365).toString());
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
app.use(express.json({ limit: "1mb" }));

// crucial middleware; these are in this order for a very important reason.
app.use(cookieParser());

app.use(middlewares.AllowGuestAccess);

app.use(middlewares.LogRequest);

app.use(middlewares.SanitiseInput);

// i think it's okay to mount this everywhere since it only mutates req.query, which should be uriencoded anyway.
// for all i know, express might do this by default, lol.
app.use(middlewares.DecodeURIComponents);

// mounts
import apiRouterV1 from "./api/v1/main";
app.use("/v1", apiRouterV1);

// if anything has not been found by this point, they're 404ing.
app.get("*", async function (req: express.Request, res: express.Response) {
    return res.status(404).json({
        success: false,
        description: "404: Endpoint does not exist.",
    });
});

export default app;
