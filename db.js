const monk = require("monk");
const url = process.env.NODE_ENV === "production" ? 'localhost:27017/kamaitachidb' : 'localhost:27017/test'
const db = monk(url);

db.then(() => {
    console.log("Connected correctly to " + url);
});

module.exports = db;