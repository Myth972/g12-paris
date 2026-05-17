import "dotenv/config";
import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./drizzle/schema.ts";

const SQLITE_PATH = "./Production en cours/sqlite.db";
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_TOKEN) {
  console.error("❌ TURSO_AUTH_TOKEN not set");
  process.exit(1);
}

console.log("🔄 Connecting to SQLite...");
const sqliteDb = new Database(SQLITE_PATH);

console.log("🔄 Connecting to Turso...");
const tursoClient = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
const tursoDb = drizzle(tursoClient);

const tables = ["users", "articles", "notifications", "notification_reads"];

async function migrateTable(tableName) {
  console.log(`\n📦 Migrating ${tableName}...`);

  try {
    const rows = sqliteDb.prepare(`SELECT * FROM ${tableName}`).all();
    console.log(`   Found ${rows.length} rows in SQLite`);

    if (rows.length === 0) {
      console.log(`   ⏭️  Skipping ${tableName} (empty)`);
      return;
    }

    const table = schema[tableName];
    if (!table) {
      console.log(`   ⚠️  No schema for ${tableName}, skipping`);
      return;
    }

    let inserted = 0;
    for (const row of rows) {
      const data = { ...row };
      for (const key of Object.keys(data)) {
        if (data[key] === null) delete data[key];
      }
      try {
        await tursoDb.insert(table).values(data).onConflictDoNothing();
        inserted++;
      } catch (e) {
        console.log(`   ⚠️  Insert error: ${e.message}`);
      }
    }

    console.log(`   ✅ Inserted ${inserted}/${rows.length} rows into Turso`);
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }
}

async function main() {
  console.log("🚀 Starting SQLite → Turso migration\n");

  for (const table of tables) {
    await migrateTable(table);
  }

  console.log("\n✅ Migration complete!");
  sqliteDb.close();
}

main().catch(console.error);