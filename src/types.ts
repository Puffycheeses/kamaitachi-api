import { Response } from "express";
import { IObjectID } from "monk";
import { Request, ParamsDictionary } from "express-serve-static-core";

declare global {
    /**
     * All MongoDB Documents require this field, or atleast they all have them in ktchi's DB.
     */
    export interface MongoDBDocument {
        _id?: IObjectID;
    }

    /**
     * ValidDatabases: Indicates the databases expected by FQ.
     */
    export type ValidDatabases =
        | "sessions"
        | "folders"
        | "scores"
        | "queries"
        | "rivals"
        | "notifications"
        | "imports"
        | "tierlistdata"
        | "tierlist"
        | "songs"
        | "charts"
        | "clans"
        | "goals"
        | "user-goals"
        | "user-milestones"
        | "milestones";

    /**
     * FQType: Indicates the type of variable expected by fancyquery for this key.
     */
    export type FQType = "string" | "integer" | "boolean" | "float";

    /**
     * Supported games by Kamaitachi.
     */
    export type Game =
        | "iidx"
        | "museca"
        | "maimai"
        | "jubeat"
        | "popn"
        | "sdvx"
        | "ddr"
        | "bms"
        | "chunithm"
        | "gitadora"
        | "usc";

    /**
     * This is the generic response from the Kamaitachi API in event of a failure.
     */
    export interface APIResponse {
        success: boolean;
        description: string;
    }

    /**
     * In the event of a successful API request, body is attached onto the request, which contains
     * endpoint-defined information about the response, such as database data.
     */
    export interface SuccessfulAPIResponse extends APIResponse {
        body: Record<string, unknown>;
    }

    /**
     * FancyQuery returns a pseudo-api response, with a statusCode on the root level.
     * This is trivially mutable into a SuccessfulAPIResponse.
     */
    interface FancyQueryPseudoResponse<T> {
        statusCode: integer;
        body: {
            success: boolean;
            description: string;
            body: FancyQueryBody<T>;
        };
    }
    interface FancyQueryBody<T> {
        items: T[];
        nextStartPoint?: integer;
    }

    interface FancyQueryCountPseudoResponse {
        statusCode: integer;
        body: {
            success: boolean;
            description: string;
            body: FancyQueryCountBody;
        };
    }
    interface FancyQueryCountBody {
        items: integer;
        nextStartPoint?: integer;
    }

    export interface Playtypes {
        iidx: "SP" | "DP";
        popn: "9B";
        sdvx: "Single";
        usc: "Single";
        ddr: "SP" | "DP";
        maimai: "Single";
        jubeat: "Single";
        museca: "Single";
        bms: "7K" | "14K" | "5K";
        chunithm: "Single";
        gitadora: "Gita" | "Dora";
    }

    export interface CustomRatings {
        iidx: {
            SP: {
                BPI: number;
                "K%": number;
            };
            DP: {
                BPI: number;
            };
        };
        popn: {
            "9B": Record<string, never>;
        };
        sdvx: {
            Single: {
                VF4: number;
                VF5: number;
            };
        };
        usc: {
            Single: {
                VF4: number;
                VF5: number;
            };
        };
        ddr: {
            SP: {
                MFCP: integer;
            };
            DP: {
                MFCP: integer;
            };
        };
        maimai: {
            Single: Record<string, never>;
        };
        jubeat: {
            Single: {
                jubility: number;
            };
        };
        museca: {
            Single: Record<string, never>;
        };
        bms: {
            "7K": Record<string, never>;
            "5K": Record<string, never>;
            "14K": Record<string, never>;
        };
        chunithm: {
            Single: Record<string, never>;
        };
        gitadora: {
            Single: Record<string, never>;
        };
    }

    /**
     * An alias for number, that makes part of the code self-documenting.
     * Note that if it were possible to enforce integer-y ness, then I would absolutely do so here
     * but i can not.
     */
    export type integer = number;

    export type MiddlewareResponse = Promise<void | Response>;

    export type EndpointResponse = Promise<void>;

    export type Ratings = Record<Game, Record<Playtypes[Game], number>>;

    export interface GoalChartQuery {
        collection: string;
        query: Record<string, unknown>;
    }

    export interface GoalDocument extends MongoDBDocument {
        directChartID: string | null;
        directChartIDs: string[] | null;
        chartQuery: GoalChartQuery | null;
        scoreQuery: Record<string, unknown>;
        criteria: {
            type: "gte" | "lte" | "lt" | "gt" | "anyMatch" | "all";
            value: number | null;
            mode: "proportion" | null;
        };
        title: string;
        goalID: string;
        timeAdded: number;
        createdBy: integer;
        game: Game;
        playtype: Playtypes[Game];
    }

    export interface UserGoalDocument extends MongoDBDocument {
        goalID: string;
        userID: integer;
        game: Game;
        playtype: Playtypes[Game];
        achieved: boolean;
        timeSet: integer;
        timeAchieved: integer | null;
        note: string | null;
        progress: number;
        progressHuman: string;
        outOf: number;
        outOfHuman: string;
    }

    interface MilestoneGoalReference {
        goalID: string;
        note: string | null;
    }

    interface MilestoneSection {
        title: string;
        desc: string;
        goals: MilestoneGoalReference[];
    }

    export interface MilestoneDocument extends MongoDBDocument {
        game: Game;
        playtype: Playtypes[Game];
        criteria: {
            /**
             * All: All goals must be achieved in order for the milestone to be complete
             * Count: Goals achieved must be greater than or equal to criteria.value.
             */
            type: "all" | "count";
            value: number | null;
        };
        createdBy: integer;
        title: string;
        desc: string;
        milestoneData: MilestoneSection[];
        milestoneID: string;
        group: string | null;
    }

    /**
     * PublicUserDocument: These are the public values returned from GetUser functions.
     * Note that the private fields: password, email and integrations, are not present in this document.
     */
    export interface PublicUserDocument extends MongoDBDocument {
        username: string;
        displayname: string;
        id: integer;
        settings: {
            nsfwsplashes: boolean;
            invisible: boolean;
            noTracking: boolean;
            useSimpleLadderColours: boolean;
            trustEamIIDXTimestamps: boolean;
        };
        friends: integer[];
        socialmedia: {
            discord: string;
            twitter: string;
            github: string;
            steam: string;
            youtube: string;
            twitch: string;
        };
        lastSeen: integer;
        about: string;
        custompfp: boolean;
        custombanner: boolean;
        ratings: Ratings;
        lampRatings: Ratings;
        customRatings: CustomRatings;
        permissions: {
            admin?: boolean;
        };
        clan: string | null;
    }

    /**
     * PrivateUserDocument is the document indicating that we've returned everything about the user
     * from the DB - including their private information.
     */
    export interface PrivateUserDocument extends PublicUserDocument {
        password: string;
        email: string;
        integrations: Record<string, Record<string, unknown>>;
    }

    export interface PublicAPIPermissions {
        selfkey: boolean;
        admin: boolean;
    }

    export interface PublicAPIKeyDocument extends MongoDBDocument {
        assignedTo: integer;
        expireTime: integer;
        apiKey: string;
        permissions: PublicAPIPermissions;
    }

    export interface PublicAPIRequestDocument extends MongoDBDocument {
        key: PublicAPIKeyDocument;
        location: string;
        timestamp: integer;
        ip: string;
    }

    export interface ChartDocument extends MongoDBDocument {
        chartID: string;
        id: integer;
        level: string;
        levelNum: number;
        difficulty: string;
        playtype: string;
        length: string;
        bpmMin: number;
        bpmMax: number;
        flags: Record<string, boolean>;
        internals: Record<string, unknown>;
        notedata: {
            notecount: integer;
            objects: Record<string, integer>;
        };
    }

    export interface SongDocument extends MongoDBDocument {
        id: integer;
        title: string;
        artist: string;
        genre: string;
        "search-titles": string[];
        "alt-titles": string[];
        firstAppearance: string;
        internals: Record<string, unknown>;
    }

    export interface FolderDocument extends MongoDBDocument {
        title: string;
        game: Game;
        custom: boolean;
        byUser: integer;
        views: integer;
        type: "query";
        query: {
            collection: string;
            query: Record<string, unknown>;
        };
        folderID: string;
        table: string;
    }

    export interface ScoreDocument extends MongoDBDocument {
        service: string;
        game: Game;
        userID: integer;
        scoreData: {
            playtype: Playtypes[Game];
            difficulty: string;
            score: number;
            lamp: string;
            hitData: Record<string, integer>;
            hitMeta: Record<string, unknown>;
            percent: number;
            grade: string;
            lampIndex: integer;
            gradeIndex: integer;
            esd?: number;
        };
        scoreMeta: Record<string, unknown>;
        calculatedData: {
            rating: number;
            lampRating: number;
            gameSpecific: Record<string, number>;
            ranking: integer;
            outOf: integer;
        };
        timeAchieved: integer | null;
        importType: string;
        validity: "valid" | "partial";
        manualImport: boolean; // probably isn't necessary
        songID: integer;
        isNewImport: boolean; // also might not be necessary anymore?
        chartID: string;
        highlight: boolean;
        xp: integer;
        comment: string | null;
        timeAdded: integer;
        isScorePB: boolean;
        isLampPB: boolean;
    }
    type KTRequest = Request<
        ParamsDictionary,
        unknown,
        Record<string, string>,
        Record<string, string>
    >;
}
