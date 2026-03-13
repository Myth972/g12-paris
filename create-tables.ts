import { createClient } from "@libsql/client";
import "dotenv/config";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("TURSO_DATABASE_URL is missing");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function main() {
  console.log("Creating tables...");
  
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS biblical_verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference TEXT NOT NULL,
        text TEXT NOT NULL,
        summary TEXT NOT NULL,
        createdAt INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL
      )
    `);
    console.log("Created biblical_verses");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS gallery_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        mediaUrl TEXT NOT NULL,
        mediaKey TEXT,
        youtubeUrl TEXT,
        verseId INTEGER,
        displayOrder INTEGER DEFAULT 0 NOT NULL,
        featured INTEGER DEFAULT 0 NOT NULL,
        createdAt INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL,
        updatedAt INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL
      )
    `);
    console.log("Created gallery_items");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS page_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pageId TEXT NOT NULL,
        contentType TEXT NOT NULL,
        title TEXT NOT NULL,
        mediaUrl TEXT NOT NULL,
        mediaKey TEXT,
        youtubeUrl TEXT,
        displayOrder INTEGER DEFAULT 0 NOT NULL,
        visible INTEGER DEFAULT 1 NOT NULL,
        description TEXT,
        authorId INTEGER NOT NULL,
        createdAt INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL,
        updatedAt INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL
      )
    `);
    console.log("Created page_content");

  } catch (e) {
    console.error("Error creating tables:", e);
  } finally {
    client.close();
  }
}

main();
