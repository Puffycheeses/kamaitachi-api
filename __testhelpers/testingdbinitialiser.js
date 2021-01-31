const db = require("./testingdb.js");
const fs = require("fs");
const path = require("path");

const TEST_DATA_LOC = "./__testdata__";

async function ResetTestingDB() {
    let testData = fs.readdirSync(TEST_DATA_LOC);
    for (const fileLoc of testData) {
        let dbName = fileLoc.split(".")[0];
        await db.get(dbName).drop();
        let fileData = fs.readFileSync(path.join(TEST_DATA_LOC, fileLoc), "UTF8");
        let jsonData;
        try {
            jsonData = JSON.parse(fileData);
        } catch (e) {
            console.error(e);
            throw `failed to parse json in file ${fileLoc}`;
        }

        await db.get(dbName).insert(jsonData);
    }
}

export { ResetTestingDB };
