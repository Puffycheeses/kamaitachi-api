const monk = require("monk");
const url = "localhost:27017/kamaitachidb";
const db = monk(url);

db.then(() => {
    console.log("Connected correctly to " + url);
});

module.exports = db;