import db from "../db";
import apiConfig from "../apiconfig";
import regexSanitise from "escape-string-regexp";
import { FindOptions } from "monk";
import { FilterQuery } from "mongodb";

const rgxIsInt = /^[0-9]+$/;
const DEFAULT_LIMIT = 100;

/**
 * Performs a "FancyQuery", which provides a couple of utilities for allowing querystrings to make decently
 * complex queries upon ktchi's database.
 * @param databaseName The Database/collection we are querying.
 * @param query The req.query parsed from the querystring of the user. Note that we explicitly reduce the complexity
 * here, by forcing all req.queries to be of string->string mapping.
 * @param paginate Whether to paginate the query or not.
 * @param limit Whether to limit the amount of results for the query or not.
 * @param configOverride Override the configuration for cases where the databaseName may not match up with apiConfig (charts-game -> charts)
 * @param useCount Use .count() instead of .find().
 * @param passedBaseQueryObj A baseQueryObject with predefined properties. For providing defaults where needed.
 */
async function FancyDBQuery<T>(
    databaseName: ValidDatabases,
    query: Record<string, string>,
    paginate?: boolean,
    limit?: integer,
    configOverride?: ValidFQDatabases,
    useCount?: boolean,
    passedBaseQueryObj?: FilterQuery<unknown>
): Promise<
    FancyQueryPseudoResponse<T> | FancyQueryCountPseudoResponse | FancyQueryPseudoErrorResponse
> {
    try {
        let dbRes = await UnstableFancyDBQuery<T>(
            databaseName,
            query,
            paginate,
            limit,
            configOverride,
            useCount,
            passedBaseQueryObj
        );

        return dbRes;
    } catch (err) {
        if (err.statusCode && err.body) {
            return {
                statusCode: err.statusCode,
                body: err.body,
            };
        } else {
            console.error(`==== FATAL ERROR IN FANCYDBQUERY ${databaseName} ====`);
            console.error(err);
            console.error(query);
            console.error(passedBaseQueryObj);
            console.error(paginate, limit, configOverride, useCount);
            console.error(`==== END VARDUMP ====`);
            return {
                statusCode: 500,
                body: {
                    success: false,
                    description: "An unknown internal server error has occured.",
                },
            };
        }
    }
}

async function UnstableFancyDBQuery<T>(
    databaseName: ValidDatabases,
    query: Record<string, string>,
    paginate?: boolean,
    limit?: integer,
    configOverride?: ValidFQDatabases,
    useCount?: boolean,
    passedBaseQueryObj?: FilterQuery<unknown>
): Promise<FancyQueryPseudoResponse<T> | FancyQueryCountPseudoResponse> {
    let baseQueryObj = passedBaseQueryObj || {};

    let validKeys;
    let validSorts;
    let defaultSort;
    if (configOverride) {
        validKeys = apiConfig.validKeys[configOverride];
        validSorts = apiConfig.validSorts[configOverride];
        defaultSort = apiConfig.defaultSorts[configOverride];
    } else {
        // WARN: overzealous assertion here,
        // if you pass something like "songs-iidx", this will fail if no override is present.
        // this is currently just overrode, but typescripts concern is genuine.
        let dn = databaseName as ValidFQDatabases;
        validKeys = apiConfig.validKeys[dn];
        validSorts = apiConfig.validSorts[dn];
        defaultSort = apiConfig.defaultSorts[dn];
    }

    // modifies baseQueryObj byref to have all the stuff we care about
    // this is disgustingly unclear, btw
    FancyQueryValidate(query, baseQueryObj, validKeys);

    let settings: FindOptions<unknown> = {
        projection: { _id: 0 },
        sort: { [defaultSort]: query.sort === "asc" ? 1 : -1 },
    };

    // This could be refactored to a config setting, but yeah
    // if we're querying the users database in ANY way, we need to
    // remove these fields.
    if (databaseName === "users") {
        settings.projection = apiConfig.REMOVE_PRIVATE_USER_RETURNS;
    }

    if (query.sortCriteria) {
        if (!validSorts.includes(query.sortCriteria)) {
            throw {
                statusCode: 400,
                body: {
                    success: false,
                    description: "Sort Criteria is invalid.",
                },
            };
        }

        // a hack indeed, as NaN/null sinks to the top of every asc/desc sort request.
        // this is a huge performance hit - zkldi
        if (!baseQueryObj[query.sortCriteria]) {
            baseQueryObj[query.sortCriteria] = { $nin: [NaN, null] };
        }

        settings.sort = { [query.sortCriteria]: query.sort === "asc" ? 1 : -1 };
    }

    if (paginate) {
        settings.skip = 0;
        settings.limit = limit ? limit : DEFAULT_LIMIT;
        if (query.limit) {
            if (query.limit && !query.limit.match(rgxIsInt)) {
                throw {
                    statusCode: 400,
                    body: {
                        success: false,
                        description: "Limit is not an integer.",
                    },
                };
            }
            if (parseInt(query.limit) > settings.limit) {
                throw {
                    statusCode: 400,
                    body: {
                        success: false,
                        description: `Limit exceeds ${settings.limit}.`,
                    },
                };
            }
            settings.limit = parseInt(query.limit);
        }

        if (query.start) {
            if (query.start && !query.start.match(rgxIsInt)) {
                throw {
                    statusCode: 400,
                    body: {
                        success: false,
                        description: "Start is not an integer.",
                    },
                };
            }
            settings.skip = parseInt(query.start);
        }
    }

    if (useCount) {
        let items = await db.get(databaseName).count(baseQueryObj);

        let itemsBody: FancyQueryCountBody = { items };

        return {
            statusCode: 200,
            body: {
                success: true,
                description: `Successfully found ${items} items.`,
                body: itemsBody,
            },
        };
    } else {
        let items = await db.get(databaseName).find(baseQueryObj, settings);

        let itemsBody: FancyQueryBody<T> = { items };

        if (
            paginate &&
            Array.isArray(items) &&
            items.length === settings.limit &&
            items.length !== 0
        ) {
            // the below || 0 check is only to keep typescript happy, its pretty certain that this is set to 0 if paginate is true.
            itemsBody.nextStartPoint = (settings.skip || 0) + settings.limit;
        }

        return {
            statusCode: 200,
            body: {
                success: true,
                description: `Successfully found ${items.length} items.`,
                body: itemsBody,
            },
        };
    }
}

/**
 * Mutates the passed queryObj and handles fancyquery parsing.
 * @param query The user's req.query.
 * @param queryObj The queryObject to mutate and eventually be sent to monk.
 * @param validKeys Key information from APIConfig about the collection we are working with.
 */
function FancyQueryValidate(
    query: Record<string, string>,
    queryObj: FilterQuery<unknown>,
    validKeys: Record<string, FQType>
): boolean {
    for (const key in validKeys) {
        if (key in queryObj) {
            continue; // ignore pre-mutated/monkeypatched data
        }
        // check that the given query even has this key
        if (key in query) {
            if (validKeys[key] === "string") {
                queryObj[key] = ParseStringModifiers(query[key], query[`${key}-opt`]);
            } else if (validKeys[key] === "integer") {
                // workaround for betweens
                if (query[`${key}-opt`] === "between") {
                    if (!query[key].includes("~")) {
                        throw {
                            statusCode: 400,
                            body: {
                                success: false,
                                description:
                                    '"between" requests require a ~ separating two numerical values.',
                            },
                        };
                    }

                    let split = query[key].split("~");

                    let v1 = split[0];
                    let v2 = split.slice(1).join("~");

                    if (!v1.match(rgxIsInt)) {
                        throw {
                            statusCode: 400,
                            body: {
                                success: false,
                                description: `${key} was not an integer (left hand value).`,
                            },
                        };
                    }

                    if (!v2.match(rgxIsInt)) {
                        throw {
                            statusCode: 400,
                            body: {
                                success: false,
                                description: `${key} was not an integer (right hand value).`,
                            },
                        };
                    }

                    queryObj[key] = ParseNumericalModifiers(
                        [parseInt(v1), parseInt(v2)],
                        query[`${key}-opt`]
                    );
                } else {
                    if (!query[key].match(rgxIsInt)) {
                        throw {
                            statusCode: 400,
                            body: {
                                success: false,
                                description: `${key} was not an integer.`,
                            },
                        };
                    }

                    queryObj[key] = ParseNumericalModifiers(
                        parseInt(query[key]),
                        query[`${key}-opt`]
                    );
                }
            } else if (validKeys[key] === "float") {
                // workaround for betweens
                if (query[`${key}-opt`] === "between") {
                    if (!query[key].includes("~")) {
                        throw {
                            statusCode: 400,
                            body: {
                                success: false,
                                description:
                                    '"between" requests require a ~ separating two numerical values.',
                            },
                        };
                    }

                    let split = query[key].split("~");

                    let v1 = parseFloat(split[0]);
                    let v2 = parseFloat(split.slice(1).join("~"));

                    if (Number.isNaN(v1)) {
                        throw {
                            statusCode: 400,
                            body: {
                                success: false,
                                description: `${key} was not a float (left hand value): ${v1}`,
                            },
                        };
                    }

                    if (Number.isNaN(v2)) {
                        throw {
                            statusCode: 400,
                            body: {
                                success: false,
                                description: `${key} was not a float (right hand value): ${v2}`,
                            },
                        };
                    }

                    queryObj[key] = ParseNumericalModifiers([v1, v2], "between");
                } else {
                    let numVal = parseFloat(query[key]);
                    if (Number.isNaN(numVal)) {
                        throw {
                            statusCode: 400,
                            body: {
                                success: false,
                                description: `${key} was not a float.`,
                            },
                        };
                    }

                    queryObj[key] = ParseNumericalModifiers(numVal, query[`${key}-opt`]);
                }
            } else if (validKeys[key] === "boolean") {
                if (!["false", "true"].includes(query[key])) {
                    throw {
                        statusCode: 400,
                        body: {
                            success: false,
                            description: `${key} was not a boolean`,
                        },
                    };
                }
                queryObj[key] = query[key] === "false" ? false : true; // presence check is done above
            }
        }
    }

    return true;
}

/**
 * Parses string-related modifiers for certain query options
 * @param value The string to modify.
 * @param option The option to mutate the string with.
 * Valid options are "like" and caseInsensitive.
 * like will create an unbounded, insensitive regex (a-la SQL).
 * caseInsensitive will create an insensitive regex.
 */
function ParseStringModifiers(value: string, option: string) {
    if (!option) {
        return value;
    } else if (option === "like") {
        return new RegExp(regexSanitise(value), "i");
    } else if (option === "caseInsensitive") {
        return new RegExp(`^${regexSanitise(value)}$`, "i");
    } else {
        throw {
            statusCode: 400,
            body: {
                success: false,
                description: `Invalid string option: ${option}`,
            },
        };
    }
}

/**
 * Parses numerical modifiers for fancy query.
 * @param value The number to modify.
 * @param option The option to mutate by. Valid options are gt, gte, lt, lte and between.
 * between expects that value is an array of two values exclusively.
 */
function ParseNumericalModifiers(value: number | number[], option: string) {
    if (!option) {
        return value;
    } else if (option === "between" && Array.isArray(value)) {
        return { $gte: value[0], $lte: value[1] };
    } else if (Array.isArray(value)) {
        // lazy catch to avoid assigning arrays to anything that shouldn't have them
        // this shouldn't happen, but just incase
        throw {
            statusCode: 400,
            body: {
                success: false,
                description: `Invalid value ${value} for ${option}`,
            },
        };
    } else if (option === "gt") {
        return { $gt: value };
    } else if (option === "gte") {
        return { $gte: value };
    } else if (option === "lt") {
        return { $lt: value };
    } else if (option === "lte") {
        return { $lte: value };
    } else {
        throw {
            statusCode: 400,
            body: {
                success: false,
                description: `Invalid numerical option: ${option}`,
            },
        };
    }
}

export default { FancyDBQuery, FancyQueryValidate };
