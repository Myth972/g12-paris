import Database from "better-sqlite3";

const db = new Database("./Production en cours/sqlite.db");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables in SQLite:", tables.map(r => r.name).join(", "));
db.close();