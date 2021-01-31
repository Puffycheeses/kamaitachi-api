/**
 * Contains common functionality for the API.
 */

import config from "../config/config";

function IsValidGame(string: string): string is Game {
    return config.supportedGames.includes(string as Game);
}

function IsValidPlaytype(string: string, game: Game): string is Playtypes[Game] {
    return config.validPlaytypes[game].includes(string as Playtypes[Game]);
}

function IsValidDifficulty(string: string, game: Game): string is Difficulties[Game] {
    return config.validDifficulties[game].includes(string);
}

function IsValidCustomRating(rating: string, game: Game, playtype: Playtypes[Game]): boolean {
    return !!config.gameSpecificCalc[game]?.[playtype]?.includes(rating);
}

export default {
    IsValidGame,
    IsValidPlaytype,
    IsValidDifficulty,
    IsValidCustomRating,
};
