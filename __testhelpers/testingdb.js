import monk from "monk";
const url = "localhost:27017/test";
const db = monk(url);

db.then(() => {
    console.log("Connected to testing db");
});

export default db;
