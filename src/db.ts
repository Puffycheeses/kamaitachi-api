import monk from "monk";
const url = "localhost:27017/kamaitachidb";
let dbtime = process.hrtime();
const db = monk(url);

db.then(() => {
    let time = process.hrtime(dbtime);
    let elapsed = time[0] + time[1] / 1000000;
    console.log(`Database connection successful: took ${elapsed}ms`);
});

export default db;
