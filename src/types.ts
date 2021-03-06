import { Response } from "express";
import { IObjectID } from "monk";

// eslint seems to think we cant resolve the below module. No idea why, as it exists.
// eslint-disable-next-line
import { Request, ParamsDictionary } from "express-serve-static-core";

declare global {
    /**
     * All MongoDB Documents require this field, or atleast they all have them in ktchi's DB.
     */
    export interface MongoDBDocument {
        _id?: IObjectID;
    }

    export type Databases =
        | "sessions"
        | "folders"
        | "scores"
        | "queries"
        | "rivals"
        | "notifications"
        | "imports"
        | "tierlistdata"
        | "tierlist"
        | "goals"
        | "user-goals"
        | "user-milestones"
        | "milestones"
        | "users";

    /**
     * ValidFQDatabases: Indicates the databases expected by FQ config overrides.
     */
    export type ValidFQDatabases = Databases | "songs" | "charts";

    export type ValidDatabases = Databases | `songs-${Game}` | `charts-${Game}`;

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
    export interface UnsuccessfulAPIResponse {
        success: false;
        description: string;
    }

    /**
     * In the event of a successful API request, body is attached onto the request, which contains
     * endpoint-defined information about the response, such as database data.
     */
    export interface SuccessfulAPIResponse {
        success: true;
        description: string;
        body: Record<string, unknown>;
    }

    export interface ChartFolderLookupDocument extends MongoDBDocument {
        chartID: string;
        folderID: string;
    }

    /**
     * FancyQuery returns a pseudo-api response, with a statusCode on the root level.
     * This is trivially mutable into a SuccessfulAPIResponse.
     */
    interface FancyQueryPseudoResponse<T> {
        statusCode: integer;
        body: {
            success: true;
            description: string;
            body: FancyQueryBody<T>;
        };
    }
    interface FancyQueryBody<T> {
        items: T[];
        nextStartPoint?: integer;
    }

    interface FancyQueryPseudoErrorResponse {
        statusCode: integer;
        body: {
            success: false;
            description: string;
        };
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

    export interface Difficulties {
        iidx: "BEGINNER" | "NORMAL" | "HYPER" | "ANOTHER" | "LEGGENDARIA";
        museca: "Green" | "Yellow" | "Red";
        maimai: "Easy" | "Basic" | "Advanced" | "Expert" | "Master" | "Re:Master";
        jubeat: "BSC" | "ADV" | "EXT";
        popn: "Easy" | "Normal" | "Hyper" | "EX";
        sdvx: "NOV" | "ADV" | "EXH" | "MXM" | "INF" | "GRV" | "HVN" | "VVD";
        ddr: "BEGINNER" | "BASIC" | "DIFFICULT" | "EXPERT" | "CHALLENGE";
        bms: "BEGINNER" | "NORMAL" | "HYPER" | "ANOTHER" | "INSANE" | "CUSTOM";
        chunithm: "BASIC" | "ADVANCED" | "EXPERT" | "MASTER" | "WORLD'S END";
        gitadora:
            | "BASIC"
            | "ADVANCED"
            | "EXTREME"
            | "MASTER"
            | "BASS BASIC"
            | "BASS ADVANCED"
            | "BASS EXTREME"
            | "BASS MASTER";
        usc: "NOV" | "ADV" | "EXH" | "INF";
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
        collection: ValidDatabases;
        query: Record<string, unknown>;
    }

    export interface GoalDocument extends MongoDBDocument {
        directChartID: string | null;
        directChartIDs?: string[] | null;
        chartQuery: GoalChartQuery | null;
        scoreQuery: Record<string, unknown>;
        criteria: {
            type: "gte" | "lte" | "lt" | "gt" | "anyMatch" | "all";
            value: number | null;
            mode?: "proportion" | null;
        };
        title: string;
        goalID: string;
        timeAdded: integer;
        createdBy: integer;
        game: Game;
        playtype: Playtypes[Game];
    }

    export interface RivalGroupDocument extends MongoDBDocument {
        name: string;
        desc: string;
        founderID: integer;
        members: integer[];
        mutualGroup: boolean;
        isDefault: boolean;
        game: Game;
        playtype: Playtypes[Game];
        settings: {
            scoreCompareMode: "relevant" | "folder";
            strictness: number;
            boundary: number;
            scoreCompareFolderID: string | null;
            cellShading: "grade" | "lamp";
        };
        rivalGroupID: string;
    }

    interface SessionScoreInfo {
        pbInfo: {
            isGeneralPB: boolean;
            isGradePB: boolean;
            isScorePB: boolean;
            isLampPB: boolean;
            isNewScore: boolean;
            lampDelta: integer;
            percentDelta: number;
            gradeDelta: integer;
            scoreDelta: number;
        };
        scoreID: string;
    }
    export interface SessionDocument extends MongoDBDocument {
        performance: number;
        userID: integer;
        sessionID: string;
        name: string;
        desc: string;
        service: string;
        game: Game;
        playtype: Playtypes[Game];
        timestamp: integer;
        timeEnded: integer;
        timeStarted: integer;
        lampPerformance: number;
        scorePerformance: number;
        scores: SessionScoreInfo[];
        highlight: boolean;
    }

    export interface ImportSessionInfo {
        sessionID: string;
        name: string; // NONSENSE
        scoreCount: integer;
        performance: number;
    }

    export interface ImportDocument extends MongoDBDocument {
        userID: integer;
        timeStarted: integer;
        timeFinished: integer;
        game: Game;
        skippedScores: integer;
        successfulScores: string[];
        service: string;
        sessionInfo: ImportSessionInfo[];
        importID: string;
        timeTaken: number;
        msPerScore: number;
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
            type: "all" | "count" | "percent";
            value: number | null;
        };
        createdBy: integer;
        title: string;
        desc: string;
        milestoneData: MilestoneSection[];
        milestoneID: string;
        group: string | null;
    }

    export interface QueryDocument extends MongoDBDocument {
        query: Record<string, string>;
        queryID: string;
        name: string;
        desc: string;
        byUser: integer;
        timeAdded: integer;
        timesUsed: integer;
        forDatabase: "scores";
    }

    export interface NotificationDocument extends MongoDBDocument {
        notifID: string;
        title: string;
        read: boolean;
        body: string;
        toUserID: integer;
        fromUserID: integer;
        type: string;
        data: Record<string, unknown>;
    }

    export interface FunFactDocument extends MongoDBDocument {
        text: string;
        nsfw: boolean;
        anonymous: boolean;
        userID: integer;
        funfactID: string;
        timestamp: integer;
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
        classes?: UserClasses;
        permissions: {
            admin?: boolean;
        };
        clan: string | null;
    }

    // the bottom set of types are horrifically confusing.
    // to ease this a bit, an example of what they're representing is below.

    /* 
        "classes" : {
            "iidx" : {
                "SP" : {
                    "dan" : "kaiden"
                }
            }
        }
    */

    type UserClasses = Partial<Record<Game, PlaytypeClasses>>;

    type PlaytypeClasses = Partial<Record<Playtypes[Game], ClassInfo>>;

    // this one is just flat out wrong btw, there are very strict requirements
    // on what strings can go in here.
    type ClassInfo = Partial<Record<string, string>>;

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
        difficulty: Difficulties[Game];
        playtype: string;
        length: string | number | null;
        bpmMin: number;
        bpmMax: number;
        flags: Record<string, boolean>;
        internals: Record<string, unknown>;
        notedata: {
            notecount: integer;
            objects: Record<string, integer>;
        };
    }

    export interface TierlistDocument extends MongoDBDocument {
        game: Game;
        title: string;
        isDefault: boolean;
        tierlistID: string;
        playtype: Playtypes[Game];
        config: {
            // I have no idea what usePrefix does.
            usePrefix?: boolean;
            grades?: [string, number][];
        };
    }

    export interface TierlistDataDocument extends MongoDBDocument {
        playtype: Playtypes[Game]; // doesn't need to exist.
        songID: integer;
        difficulty: Difficulties[Game];
        tierlistID: string;
        tiers: Record<string, number>; // temp
        chartID: string;
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

    export interface UserMilestoneDocument extends MongoDBDocument {
        milestoneID: string;
        userID: integer;
        game: Game;
        playtype: Playtypes[Game];
        timeSet: integer;
        achieved: boolean;
        timeAchieved: integer | null;
        progress: integer;
    }

    export interface ScoreDocument extends MongoDBDocument {
        service: string;
        game: Game;
        userID: integer;
        scoreData: {
            playtype: Playtypes[Game];
            difficulty: Difficulties[Game];
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
            ranking: integer | null;
            outOf: integer | null;
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
        scoreID: string;
    }

    type KTRequest = Request<
        ParamsDictionary,
        unknown,
        Record<string, string>,
        Record<string, string>
    >;
}
