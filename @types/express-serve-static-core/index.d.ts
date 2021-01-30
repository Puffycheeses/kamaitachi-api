// hack to convince ts we're in an es6 module.
export {};

declare global {
    namespace Express {
        interface Request {
            apikey: PublicAPIKeyDocument | null;
            /**
             * Refers to the user that is making the request. For guested requests, this is null.
             */
            user: PublicUserDocument | null;
            /**
             * For requests that involve a userID in params, requestedUser contains said requested user.
             */
            requestedUser: PublicUserDocument | null;
            score?: ScoreDocument;
            folderData?: FolderDocument;
            rivalGroup?: RivalGroupDocument;
            song?: SongDocument;
        }
    }
}
