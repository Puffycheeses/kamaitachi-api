const db = require("../db.js");
const apiConfig = require("../apiconfig.js");

const rgxIsInt = /^[0-9]+$/;
const DEFAULT_LIMIT = 100;

// does fancy pagination and all that jazz
// it is assumed that everything entering through query is a string.
// if you are putting numeric input into here, coerce it into a string with "" +.
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

    try {
        // modifies queryObj byref to have all the stuff we care about
        FancyQueryValidate(query, queryObj, validKeys);
    }
    catch (r) {
        return r;
    }

    let settings = {
        fields: {_id: 0},
        sort: {[defaultSort]: query.sort === "asc" ? 1 : -1}
    }

    if (query.sortCriteria){
        if (!validSorts.includes(query.sortCriteria)){
            return {
                statusCode: 400,
                body: {
                    success: false,
                    description: "Sort Criteria is invalid."
                }
            }
        }

        // a hack indeed, as NaN sinks to the top of every desc sort request.
        if (!queryObj[query.sortCriteria]){
            queryObj[query.sortCriteria] = {$ne: NaN};
        }

        settings.sort = {[query.sortCriteria]: query.sort === "asc" ? 1 : -1};
    }

    if (paginate){
        settings.skip = 0
        settings.limit = limit ? limit : DEFAULT_LIMIT;
        if (query.limit){
            if (query.limit && !query.limit.match(rgxIsInt)){
                return {
                    statusCode: 400,
                    body: {
                        success: false,
                        description: "Limit is not an integer."
                    }
                }
            }
            if (parseInt(query.limit) > settings.limit){
                return {
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
                return {
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
        // N+1, see rest N+1 problem.
        itemsBody.nextStartPoint = settings.skip + settings.limit + 1;
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
                queryObj[key] = query[key];
            }
            else if (validKeys[key] === "integer"){
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
            else if (validKeys[key] === "float"){
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