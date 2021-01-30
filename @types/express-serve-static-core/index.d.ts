// hack to convince ts we're in an es6 module.
export {};

declare global {
    namespace Express {
        interface Request {
            // query: Record<string, string>;
            // body: Record<string, string>;
            apikey: PublicAPIKeyDocument | null;
            /**
             * Refers to the user that is making the request. For guested requests, this is null.
             */
            user: PublicUserDocument | null;
            /**
             * For requests that involve a userID in params, requestedUser contains said requested user.
             */
            requestedUser: PublicUserDocument | null;
            /**
             * For scoreID endpoints, the specific score requested by the user.
             */
            score?: ScoreDocument;
            /**
             * For folder related endpoints, this is the folder requested
             */
            folderData?: FolderDocument;
            /**
             * For rival related endpoints, this is the folder requested
             */
            rivalGroup?: RivalGroupDocument;
        }
    }
}
