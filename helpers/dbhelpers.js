const db = require("../db.js");
const apiConfig = require("../apiconfig.js");

const rgxIsInt = /^[0-9]+$/;
const DEFAULT_LIMIT = 100;

// does fancy pagination and all that jazz
// it is assumed that everything entering through query is a string.
// if you are putting numeric input into here, coerce it into a string with "" +.
async function FancyDBQuery(databaseName, query, paginate, limit, configOverride, useCount){
    let queryObj = {}

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

    for (const key in validKeys) {
        // check that the given query even has this key
        if (key in query){
            if (validKeys[key] === "string"){
                queryObj[key] = query[key];
            }
            else if (validKeys[key] === "integer"){
                if (!query[key].match(rgxIsInt)){
                    return {
                        statusCode: 400,
                        body: {
                            success: false,
                            description: key + " was not an integer."
                        }
                    }
                }
                queryObj[key] = parseInt(query[key]);
            }
            else if (validKeys[key] === "float"){
                let numVal = parseFloat(query[key]);
                if (Number.isNaN(numVal)){
                    return {
                        statusCode: 400,
                        body: {
                            success: false,
                            description: key + " was not a float."
                        }
                    }
                }
                queryObj[key] = numVal;
            }
            else if (validKeys[key] === "boolean"){
                if (["false","true"].includes(queryObj[key])){
                    return {
                        statusCode: 400,
                        body: {
                            success: false,
                            description: key + " was not a boolean"
                        }
                    }
                }
                queryObj[key] = queryObj[key] === "false" ? false : true; // presence check is done above
            }
        }
    }

    let settings = {
        fields: {_id: 0},
        sort: {[defaultSort]: query.sort === "asc" ? 1 : -1}
    }

    // critical modifier: exact
    // returns only one item that exactly matches the query
    // if none, returns 404.
    if (query.exact && query.exact !== "false"){
        if (Object.keys(queryObj).length === 0){
            return {
                statusCode: 400,
                body: {
                    success: false,
                    description: "Cannot perform exact query with no additional information."
                }
            }
        }
        let item = await db.get(databaseName).findOne(queryObj, settings);
        if (!item){
            return {
                statusCode: 404,
                body: {
                    success: false,
                    description: "Exact item was not found."
                }
            }
        }
        else {
            return {
                statusCode: 200,
                body: {
                    success: true,
                    description: "Successfully found exact item.",
                    body: {
                        item
                    }
                }
            }
        }
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
        settings.sort = query.sortCriteria;
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

module.exports = {
    FancyDBQuery
}