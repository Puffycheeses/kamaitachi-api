const db = require("../db.js");
const apiConfig = require("../apiconfig.js");
const regexSanitise = require("escape-string-regexp");

const rgxIsInt = /^[0-9]+$/;
const DEFAULT_LIMIT = 100;

// does fancy pagination and all that jazz
// it is assumed that everything entering through query is a string.
async function FancyDBQuery(databaseName, query, paginate, limit, configOverride, useCount, queryObj){
    queryObj = queryObj || {}

    let validKeys;
    let validSorts;
    let defaultSort;
    if (configOverride){
        validKeys = apiConfig.validKeys[configOverride];
        validSorts = apiConfig.validSorts[configOverride];
        defaultSort = apiConfig.defaultSorts[configOverride];
    }
    else {
        validKeys = apiConfig.validKeys[databaseName];
        validSorts = apiConfig.validSorts[databaseName];
        defaultSort = apiConfig.defaultSorts[databaseName];
    }

    // modifies queryObj byref to have all the stuff we care about
    FancyQueryValidate(query, queryObj, validKeys);

    let settings = {
        projection: {_id: 0},
        sort: {[defaultSort]: query.sort === "asc" ? 1 : -1}
    }

    if (query.sortCriteria){
        if (!validSorts.includes(query.sortCriteria)){
            throw {
                statusCode: 400,
                body: {
                    success: false,
                    description: "Sort Criteria is invalid."
                }
            }
        }

        // a hack indeed, as NaN/null sinks to the top of every asc/desc sort request.
        if (!queryObj[query.sortCriteria]){
            queryObj[query.sortCriteria] = {$nin: [NaN, null]};
        }

        settings.sort = {[query.sortCriteria]: query.sort === "asc" ? 1 : -1};
    }

    if (paginate){
        settings.skip = 0
        settings.limit = limit ? limit : DEFAULT_LIMIT;
        if (query.limit){
            if (query.limit && !query.limit.match(rgxIsInt)){
                throw {
                    statusCode: 400,
                    body: {
                        success: false,
                        description: "Limit is not an integer."
                    }
                }
            }
            if (parseInt(query.limit) > settings.limit){
                throw {
                    statusCode: 400,
                    body: {
                        success: false,
                        description: "Limit exceeds " + settings.limit + "."
                    }
                }
            }
            settings.limit = parseInt(query.limit);
        }

        if (query.start){
            if (query.start && !query.start.match(rgxIsInt)){
                throw {
                    statusCode: 400,
                    body: {
                        success: false,
                        description: "Start is not an integer."
                    }
                }
            }
            settings.skip = parseInt(query.start);
        }
    }

    let method = useCount ? "count" : "find";

    let items = await db.get(databaseName)[method](queryObj, settings);
    let itemsBody = {items};

    if (paginate && items.length === settings.limit && items.length !== 0){
        itemsBody.nextStartPoint = settings.skip + settings.limit;
    }
    
    return {
        statusCode: 200,
        body: {
            success: true,
            description: "Successfully found " + (useCount ? items : items.length) + " items.",
            body: itemsBody
        }
    }
}

// true on success
// throws hard if err.
function FancyQueryValidate(query, queryObj, validKeys){
    for (const key in validKeys) {
        if (key in queryObj){
            continue; // ignore pre-mutated/monkeypatched data
        }
        // check that the given query even has this key
        if (key in query){
            if (validKeys[key] === "string"){
                queryObj[key] = ParseStringModifiers(query[key], query[key + "-opt"]);
            }
            else if (validKeys[key] === "integer"){
                // workaround for betweens
                if (query[key + "-opt"] === "between") {
                    if (!query[key].includes("~")) {
                        throw {
                            statusCode: 400,
                            body: {
                                success: false,
                                description: `"between" requests require a ~ separating two numerical values.`
                            }
                        }
                    }

                    let split = query[key].split("~");

                    let v1 = split[0];
                    let v2 = split.slice(1).join("~");

                    if (!v1.match(rgxIsInt)) {
                        throw {
                            statusCode: 400,
                            body: {
                                success: false,
                                description: key + " was not an integer (left hand value)."
                            }
                        }
                    }

                    if (!v2.match(rgxIsInt)) {
                        throw {
                            statusCode: 400,
                            body: {
                                success: false,
                                description: key + " was not an integer (right hand value)."
                            }
                        }
                    }

                    queryObj[key] = ParseNumericalModifiers([v1,v2], query[key + "-opt"]);
                }
                else {
                    if (!query[key].match(rgxIsInt)){
                        throw {
                            statusCode: 400,
                            body: {
                                success: false,
                                description: key + " was not an integer."
                            }
                        }
                    }

                    queryObj[key] = ParseNumericalModifiers(parseInt(query[key]), query[key + "-opt"]);
                }
            }
            else if (validKeys[key] === "float"){
                // workaround for betweens
                if (query[key + "-opt"] === "between") {
                    if (!query[key].includes("~")) {
                        throw {
                            statusCode: 400,
                            body: {
                                success: false,
                                description: `"between" requests require a ~ separating two numerical values.`
                            }
                        }
                    }

                    let split = query[key].split("~");

                    let v1 = parseFloat(split[0]);
                    let v2 = parseFloat(split.slice(1).join("~"));

                    if (Number.isNaN(v1)) {
                        throw {
                            statusCode: 400,
                            body: {
                                success: false,
                                description: key + " was not a float (left hand value): " + v1
                            }
                        }
                    }

                    if (Number.isNaN(v2)) {
                        throw {
                            statusCode: 400,
                            body: {
                                success: false,
                                description: key + " was not a float (right hand value): " + v2
                            }
                        }
                    }

                    queryObj[key] = ParseNumericalModifiers([v1,v2], query[key + "-opt"]);
                }
                else {
                    let numVal = parseFloat(query[key]);
                    if (Number.isNaN(numVal)){
                        throw {
                            statusCode: 400,
                            body: {
                                success: false,
                                description: key + " was not a float."
                            }
                        }
                    }
    
                    queryObj[key] = ParseNumericalModifiers(numVal, query[key + "-opt"]);
                }
            }
            else if (validKeys[key] === "boolean"){
                if (!["false","true"].includes(query[key])){
                    throw {
                        statusCode: 400,
                        body: {
                            success: false,
                            description: key + " was not a boolean"
                        }
                    }
                }
                queryObj[key] = query[key] === "false" ? false : true; // presence check is done above
            }
        }
    }

    return true;
}

function ParseStringModifiers(value, option){
    if (!option){
        return value;
    }
    else if (option === "like"){
        return new RegExp(regexSanitise(value), "i");
    }
    else if (option === "caseInsensitive"){
        return new RegExp(`^${regexSanitise(value)}$`, "i");
    }
    else {
        throw {
            statusCode: 400,
            body: {
                success: false,
                description: "Invalid string option: " + option
            }
        };
    }
}

function ParseNumericalModifiers(value, option){
    if (!option){
        return value;
    }
    else if (option === "gt"){
        return {$gt: value}
    }
    else if (option === "gte"){
        return {$gte: value}
    }
    else if (option === "lt"){
        return {$lt: value}
    }
    else if (option === "lte"){
        return {$lte: value}
    }
    else if (option === "between") {
        return {$gte: parseInt(value[0]), $lte: parseInt(value[1])}
    }
    else {
        throw {
            statusCode: 400,
            body: {
                success: false,
                description: "Invalid numerical option: " + option
            }
        };
    }
}

module.exports = {
    FancyDBQuery,
    FancyQueryValidate
}