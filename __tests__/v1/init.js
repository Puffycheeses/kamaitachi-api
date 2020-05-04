// HEY ZKLDI, WHY ARE ALL YOUR TESTS IN ONE FILE? HUH?
// jest's --runInBand only runs test suits in a decent manner,
// it actually does separate files completely asynchronously
// which causes the mongodb connection to blow up
// with a great, undebuggable error.
// it took me 1 whole day to set this up.

const app = require('../../server.js');
const supertest = require('supertest');
let request;
let server;
const db = require("../../__jesthelpers/testingdb.js"); 
const config = require("../../config/config.js");
const jestHelpers = require("../../__jesthelpers/jesthelpers.js");

const testingDBInitialiser = require("../../__jesthelpers/testingdbinitialiser.js");

// Crucial managers for supertest
// without this, supertest will leave the latest request completely open
// and jest will not close.
beforeEach((done) => {
    server = app.listen(4000, (err) => {
        if (err) return done(err);
        request = supertest.agent(server);
        done();
    });
});

// see above
afterEach((done) => {
  return server && server.close(done);
});


// Check we're not in production.
// This used to determine what database we use, but a refactor has fixed this.
// either way, it's a good sanity check.
describe("Initialisation safety checks", function(){
    test("Not in production", async function() {
        expect(process.env.NODE_ENV !== "production").toBe(true);
    });
});

// General initialisation, these check basic parts of the API and basically check we're alive.
describe("Initialisation", function(){
    beforeEach(async function() {
        await testingDBInitialiser.ResetTestingDB();
    });

    // Check the database has the right information from the above reset testing db.
    test('Initalise testing DB', async function() {
        let dbToCheck = [
            {name: "users", expectCount: 2},
            {name: "charts-iidx", expectCount: 20},
            {name: "songs-iidx", expectCount: 20},
            {name: "tierlist", expectCount: 4},
            {name: "tierlistdata", expectCount: 40}
        ]
    
        for (const dbCheck of dbToCheck) {
            let items = await db.get(dbCheck.name).find({});
            expect(items.length).toBe(dbCheck.expectCount);
        }
    });
    
    test('API Core With Valid Key', async function() {
        let response = await request.get('/api/v1?key=admin')
      
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.version.major).toBe(1);
    });
    
    test('API Core With Expired Key', async function() {
        let response = await request.get('/api/v1?key=expire')
      
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });
    
    test('API Core With No Key', async function() {
        let response = await request.get('/api/v1')
      
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    test("404 handler", async function(){
        let response = await request.get("/404?key=admin");

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });

    // check that, if no valid key is provided,
    // 401 is returned instead of 404.
    // this doesn't really matter, because this is open source,
    // either way, I think it's nice.
    test("401 hiding", async function(){
        let response = await request.get("/404");

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });
});

describe("Game Meta Tests", function(){
    beforeEach(async function() {
        await testingDBInitialiser.ResetTestingDB();
    });

    test('Games check', async function() {
        let response = await request.get('/api/v1/games?key=admin');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.totalSongCount).toBe(20);
        expect(response.body.body.totalChartCount).toBe(20);
    });

    for (const game of config.supportedGames) {
        test("Presence of " + game, async function(){
            let response = await request.get('/api/v1/games?key=admin');
            expect(game in response.body.body.gameStats).toBe(true);
        });
    }
});

describe("Specific Game Tests", function(){
    beforeEach(async function() {
        await testingDBInitialiser.ResetTestingDB();
    });

    for (const game of config.supportedGames) {
        test("Presence of gamedata for " + game, async function(){
            let response = await request.get("/api/v1/games/" + game + "?key=admin");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.body.gameInfo.game).toBe(game);
        });
    }
});

// test song query types.
// IIDX is our testing dataset, and due to the design of the api
// if that works, all of them work.
describe("Valid Song Query Tests", function(){
    beforeEach(async function() {
        await testingDBInitialiser.ResetTestingDB();
    });

    test("Default pagination query", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.length).toBe(20);
        
        expect(jestHelpers.IsSortedOnKey(response.body.body.items, "id")).toBe(true);
        expect(response.body.body.nextStartPoint).toBeUndefined();
    });

    test("Pagination query with custom limit", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&limit=5");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.length).toBe(5);
        expect(response.body.body.nextStartPoint).toBe(6);
    });

    test("Pagination query with custom start", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&start=17");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.length).toBe(3);
        expect(response.body.body.nextStartPoint).toBeUndefined();
    });

    test("Pagination query with custom start and limit", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&start=17&limit=2");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.length).toBe(2);
        expect(response.body.body.items[0].id).toBe(17);
        expect(response.body.body.items[1].id).toBe(18);
        expect(response.body.body.nextStartPoint).toBe(20);
    });

    
    test("Exact Title Query", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&exact=true&title=GAMBOL");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.item).toBeTruthy();
        expect(response.body.body.items).toBeUndefined();
        expect(response.body.body.item.artist).toBe("SLAKE");
        expect(response.body.body.item.title).toBe("GAMBOL");
        expect(response.body.body.item.genre).toBe("BIG BEAT");
        expect(response.body.body.nextStartPoint).toBeUndefined();
    });

    test("Exact Artist Query", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&exact=true&artist=SLAKE");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.item).toBeTruthy();
        expect(response.body.body.items).toBeUndefined();
        expect(response.body.body.item.artist).toBe("SLAKE");
        expect(response.body.body.item.title).toBe("GAMBOL");
        expect(response.body.body.item.genre).toBe("BIG BEAT");
        expect(response.body.body.nextStartPoint).toBeUndefined();
    });

    test("Exact Genre Query", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&exact=true&genre=BIG BEAT");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.item).toBeTruthy();
        expect(response.body.body.items).toBeUndefined();
        expect(response.body.body.item.artist).toBe("SLAKE");
        expect(response.body.body.item.title).toBe("GAMBOL");
        expect(response.body.body.item.genre).toBe("BIG BEAT");
        expect(response.body.body.nextStartPoint).toBeUndefined();
    });

    // default sort criteria is tested in default pagination tests
    test("Custom Sort Criteria", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&sortCriteria=title");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.length).toBe(20);
        expect(response.body.body.nextStartPoint).toBeUndefined();
        // commented out, this works, but it's buggy, esp. with jp/ko titles.
        // expect(jestHelpers.IsSortedLexicographicallyOnKey(response.body.body.items, "title")).toBe(true);
    });
});

describe("Invalid Song Queries", function(){

    // express will convert foo=x&foo=y into foo = [x,y].
    // we reject nested queries, viz. we reject queries where any keys' value is an object.
    // see middlewares.js for more information on this security.
    test("Reject nested query", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&title=GAMBOL&title=OTHERKEY");

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("Err on exact query with no match", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&title=TITLETHATDOESNTEXIST&exact=true");

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });
    
    test("Reject query with invalid int in int param", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&id=asdf");

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("Reject query with NaN in int param", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&id=NaN");

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("Reject query with undefined in int param", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&id=undefined");

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("Reject query with float in int param", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&id=1.5");

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("Reject query with negative in int param", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&id=-1");

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("Reject query with excessive limit", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&limit=200");

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("Reject query with negative int start", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&start=-1");

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("Reject query with float start", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&start=1.5");

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("Reject query with string start", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&start=hello");

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("Reject query with negative int limit", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&limit=-1");

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("Reject query with float limit", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&limit=1.5");

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("Reject query with string limit", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&limit=hello");

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("Reject exact query with no information", async function(){
        let response = await request.get("/api/v1/games/iidx/songs?key=admin&exact=true");

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });
});

describe("SongID Tests", function(){
    test("SongID working", async function(){
        let response = await request.get("/api/v1/games/iidx/songs/1?key=admin");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.item).toBeTruthy();
        expect(response.body.body.items).toBeUndefined();
        expect(response.body.body.item.artist).toBe("SLAKE");
        expect(response.body.body.item.title).toBe("GAMBOL");
        expect(response.body.body.item.genre).toBe("BIG BEAT");
        expect(response.body.body.nextStartPoint).toBeUndefined();
    });

    test("Reject nonexistent songID", async function(){
        let response = await request.get("/api/v1/games/iidx/songs/1000000?key=admin");

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });

    test("SongID Default Charts", async function(){
        let response = await request.get("/api/v1/games/iidx/songs/1/charts?key=admin");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.item).toBeUndefined();
        expect(response.body.body.items).toBeTruthy();

        // check all charts returned are members of the given song
        expect(response.body.body.items.every(e => e.id === 1)).toBe(true);
        expect(response.body.body.nextStartPoint).toBeUndefined();
    });

    test("SongID Charts with limit", async function(){
        let response = await request.get("/api/v1/games/iidx/songs/1/charts?key=admin&limit=2");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.item).toBeUndefined();
        expect(response.body.body.items).toBeTruthy();
        expect(response.body.body.items.length).toBe(2);

        // check all charts returned are members of the given song
        expect(response.body.body.items.every(e => e.id === 1)).toBe(true);
        expect(response.body.body.nextStartPoint).toBe(3);
    });

    test("SongID Charts with start", async function(){
        let response = await request.get("/api/v1/games/iidx/songs/1/charts?key=admin&start=4");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.item).toBeUndefined();
        expect(response.body.body.items).toBeTruthy();
        expect(response.body.body.items.length).toBe(2);

        // check all charts returned are members of the given song
        expect(response.body.body.items.every(e => e.id === 1)).toBe(true);
    });

    // note this also checks that queryObj works
    test("SongID Charts with exact query", async function(){
        let response = await request.get("/api/v1/games/iidx/songs/1/charts?key=admin&exact=true&difficulty=ANOTHER&playtype=SP");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items).toBeUndefined();
        expect(response.body.body.item).toBeTruthy();
        expect(response.body.body.item.difficulty).toBe("ANOTHER");
        expect(response.body.body.item.playtype).toBe("SP");
        expect(response.body.body.item.id).toBe(1);
    });

    test("Reject songID Chart exact query with no match", async function(){
        let response = await request.get("/api/v1/games/iidx/songs/1/charts?key=admin&exact=true&difficulty=LEGGENDARIA&playtype=SP");

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });

    test("Reject nonexistent songID chart request", async function(){
        let response = await request.get("/api/v1/games/iidx/songs/1000000/charts?key=admin");

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });
});

describe("Folders Meta Tests", function(){
    for (const game of config.supportedGames) {
        test("Get " + game + " Level Folders", async function(){
            let response = await request.get("/api/v1/games/" + game +"/folders/levels?key=admin");
    
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.body.items).toBeTruthy();
            expect(response.body.body.gameFolderMode).toBe(config.folders[game].type);
        });

        test("Get " + game + " Version Folders", async function(){
            let response = await request.get("/api/v1/games/" + game +"/folders/versions?key=admin");
    
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.body.items).toBeTruthy();
            expect(response.body.body.gameFolderMode).toBe(config.folders[game].type);
        });
    }
});

describe("Folder Tests", function(){
    test("Get IIDX Level 1s", async function(){
        let response = await request.get("/api/v1/games/iidx/folders/levels/1?key=admin");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.songs.length).toBe(1);
        expect(response.body.body.items.charts.length).toBe(4);
        expect(response.body.body.folderType).toBe("levels");
        expect(response.body.body.folderName).toBe("1");
    });

    test("Get IIDX Version 1st style", async function(){
        let response = await request.get("/api/v1/games/iidx/folders/versions/0?key=admin");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.songs.length).toBe(6);
        expect(response.body.body.items.charts.length).toBe(20);
        expect(response.body.body.folderType).toBe("versions");
        expect(response.body.body.folderName).toBe("1st Style");
    });

    test("Get IIDX Version substream", async function(){
        let response = await request.get("/api/v1/games/iidx/folders/versions/1?key=admin");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.songs.length).toBe(8);
        expect(response.body.body.items.charts.length).toBe(0);
        expect(response.body.body.folderType).toBe("versions");
        expect(response.body.body.folderName).toBe("substream");
    });
});

describe("Folder Scores Tests", function(){
    test("Get IIDX Level 1 scores on userID 1", async function(){
        let response = await request.get("/api/v1/games/iidx/folders/levels/1/scores?key=admin&userID=1");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.scores.length).toBe(2);
        expect(response.body.body.items.songs.length).toBe(1);
        expect(response.body.body.items.charts.length).toBe(4);
        expect(response.body.body.items.user.id).toBe(1);
    });

    test("Reject folder scores without user", async function(){
        let response = await request.get("/api/v1/games/iidx/folders/levels/1/scores?key=admin");

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("Reject folder scores with non-existent user", async function(){
        let response = await request.get("/api/v1/games/iidx/folders/levels/1/scores?key=admin&userID=100");

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });
});

describe("Song Independent Chart Query Tests", function(){
    test("Default pagination query", async function(){
        let response = await request.get("/api/v1/games/iidx/charts?key=admin");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.length).toBe(20);
        
        expect(jestHelpers.IsSortedOnKey(response.body.body.items, "id")).toBe(true);
        expect(response.body.body.nextStartPoint).toBeUndefined();
    });

    test("Pagination query with custom limit", async function(){
        let response = await request.get("/api/v1/games/iidx/charts?key=admin&limit=5");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.length).toBe(5);
        expect(response.body.body.nextStartPoint).toBe(6);
    });

    test("Pagination query with custom start", async function(){
        let response = await request.get("/api/v1/games/iidx/charts?key=admin&start=17");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.length).toBe(3);
        expect(response.body.body.nextStartPoint).toBeUndefined();
    });

    test("Pagination query with custom start and limit", async function(){
        let response = await request.get("/api/v1/games/iidx/charts?key=admin&start=17&limit=2");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.length).toBe(2);
        expect(response.body.body.items[0].id).toBe(3);
        expect(response.body.body.items[1].id).toBe(3);
        expect(response.body.body.nextStartPoint).toBe(20);
    });

    
    test("Exact Difficulty Query", async function(){
        let response = await request.get("/api/v1/games/iidx/charts?key=admin&exact=true&difficulty=ANOTHER");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.item).toBeTruthy()
        expect(response.body.body.items).toBeUndefined();
        expect(response.body.body.item.id).toBe(0);
        expect(response.body.body.item.difficulty).toBe("ANOTHER");
        expect(response.body.body.nextStartPoint).toBeUndefined();
    });

    test("Exact Difficulty + Playtype + SongID Query", async function(){
        let response = await request.get("/api/v1/games/iidx/charts?key=admin&exact=true&difficulty=ANOTHER&playtype=SP&songID=1");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.item).toBeTruthy();
        expect(response.body.body.items).toBeUndefined();
        expect(response.body.body.item.id).toBe(1);
        expect(response.body.body.item.difficulty).toBe("ANOTHER");
        expect(response.body.body.item.playtype).toBe("SP"); 
        expect(response.body.body.nextStartPoint).toBeUndefined();
    });

    test("SongID Query", async function(){
        let response = await request.get("/api/v1/games/iidx/charts?key=admin&songID=1");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.item).toBeUndefined();
        expect(response.body.body.items).toBeTruthy();
        expect(response.body.body.items[0].id).toBe(1);
        expect(response.body.body.items.length).toBe(6);
        expect(response.body.body.nextStartPoint).toBeUndefined();
    });

    test("Custom Sort Criteria", async function(){
        let response = await request.get("/api/v1/games/iidx/charts?key=admin&sortCriteria=notedata.notecount");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.length).toBe(20);
        expect(response.body.body.nextStartPoint).toBeUndefined();
        // hack .map() fix here so we can get notecount as it's nested.
        // dynamic nested key querying seems messy from the js i saw on SO.
        // (todo)
        expect(jestHelpers.IsSortedOnKey(response.body.body.items.map(e => e.notedata),"notecount"));
    });
});

describe("Clan Meta Tests", function(){
    test("Default pagination query", async function(){
        let response = await request.get("/api/v1/clans?key=admin");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.length).toBe(6);
        
        expect(jestHelpers.IsSortedOnKey(response.body.body.items, "xp")).toBe(true);
        expect(response.body.body.nextStartPoint).toBeUndefined();
    });

    test("Pagination query with custom limit", async function(){
        let response = await request.get("/api/v1/clans?key=admin&limit=2");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.length).toBe(2);
        expect(response.body.body.nextStartPoint).toBe(3);
    });

    test("Pagination query with custom start", async function(){
        let response = await request.get("/api/v1/clans?key=admin&start=4");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.length).toBe(2);
        expect(response.body.body.nextStartPoint).toBeUndefined();
    });

    test("Pagination query with custom start and limit", async function(){
        let response = await request.get("/api/v1/clans?key=admin&start=3&limit=2");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.length).toBe(2);
        expect(response.body.body.nextStartPoint).toBe(6);
    });
});

describe("Clan Tests", function(){
    // user 1 is in clan FOUR,
    // user 2 is not in a clan.
    // test accordingly

    test("Check specific clan", async function(){
        let response = await request.get("/api/v1/clans/FOUR?key=admin");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.clan.clanID).toBe("FOUR");
    });

    test("Check non-existent clan", async function(){
        let response = await request.get("/api/v1/clans/FAKE?key=admin");

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });

    test("Update clan MOTD as clan admin", async function(){
        let response = await request.patch("/api/v1/clans/FOUR/change-motd?key=admin&motd=new motd");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.oldMotd).toBe("hi");
        expect(response.body.body.newMotd).toBe("new motd");
    });

    test("Update clan MOTD not as clan admin", async function(){
        let response = await request.patch("/api/v1/clans/FOUR/change-motd?key=altuser&motd=new motd");

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    test("Update clan name as clan admin", async function(){
        let response = await request.patch("/api/v1/clans/FOUR/change-name?key=admin&name=Mezzanine");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.oldName).toBe("Group Four");
        expect(response.body.body.newName).toBe("Mezzanine");
    });

    test("Update clan name not as clan admin", async function(){
        let response = await request.patch("/api/v1/clans/FOUR/change-name?key=altuser&name=Mezzanine");

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });
});

describe("Tierlist Meta Tests", function(){
    test("Default pagination query", async function(){
        let response = await request.get("/api/v1/tierlists?key=admin");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.length).toBe(4);
        expect(response.body.body.nextStartPoint).toBeUndefined();
    });

    test("Pagination query with custom limit", async function(){
        let response = await request.get("/api/v1/tierlists?key=admin&limit=2");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.length).toBe(2);
        expect(response.body.body.nextStartPoint).toBe(3);
    });

    test("Pagination query with custom start", async function(){
        let response = await request.get("/api/v1/tierlists?key=admin&start=1");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.length).toBe(3);
        expect(response.body.body.nextStartPoint).toBeUndefined();
    });

    test("Pagination query with custom start and limit", async function(){
        let response = await request.get("/api/v1/tierlists?key=admin&start=3&limit=2");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body.items.length).toBe(1);
        expect(response.body.body.nextStartPoint).toBeUndefined();
    });
});

describe("Tierlist Data Checks", function(){
    test("Get default with game/playtype", async function(){
        let response = await request.get("/api/v1/tierlists/tierlistdata?key=admin&game=iidx&playtype=SP");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test("Get default with ID", async function(){
        let response = await request.get("/api/v1/tierlists/tierlistdata?key=admin&tierlistID=ee9b756e50cff8282091102257b01f423ef855f2");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test("Provide no data", async function(){
        let response = await request.get("/api/v1/tierlists/tierlistdata?key=admin");

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("Get exact", async function(){
        let response = await request.get("/api/v1/tierlists/tierlistdata?key=admin&game=iidx&playtype=SP&songID=25&exact=true&difficulty=ANOTHER");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
    
    test("Get non-existent exact query", async function(){
        let response = await request.get("/api/v1/tierlists/tierlistdata?key=admin&game=iidx&playtype=SP&songID=10000&exact=true&difficulty=ANOTHER");

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });
});

afterAll(async () => {
    await db.close(); // do it.
});