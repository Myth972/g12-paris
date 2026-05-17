import Database from "better-sqlite3";

const db = new Database("./Production en cours/sqlite.db");

console.log("=== Users ===");
console.log(db.prepare("SELECT * FROM users").all());

console.log("\n=== Articles ===");
console.log(db.prepare("SELECT COUNT(*) as count FROM articles").get());

console.log("\n=== Notifications ===");
console.log(db.prepare("SELECT * FROM notifications").all());

db.close();