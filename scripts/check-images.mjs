import "dotenv/config";
import { createClient } from "@libsql/client";

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

async function check() {
  console.log("=== Page Content (media URLs) ===");
  const content = await client.execute("SELECT id, pageId, title, mediaUrl FROM page_content");
  console.log(content.rows.slice(0, 5).map(r => ({ pageId: r.pageId, title: r.title, url: r.mediaUrl })));

  console.log("\n=== Articles (cover images) ===");
  const articles = await client.execute("SELECT id, title, coverImageUrl FROM articles LIMIT 5");
  console.log(articles.rows);
}

check();