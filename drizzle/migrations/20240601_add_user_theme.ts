import { sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export async function up(db) {
  await db.run(sql`CREATE TABLE IF NOT EXISTS user_theme (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'light',
    updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );`);
}

export async function down(db) {
  await db.run(sql`DROP TABLE IF EXISTS user_theme;`);
}
