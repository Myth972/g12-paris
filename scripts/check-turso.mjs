import "dotenv/config";
import { createClient } from "@libsql/client";

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

async function check() {
  console.log("=== Turso: Users ===");
  const users = await client.execute("SELECT * FROM users");
  console.log(users.rows);

  console.log("\n=== Turso: Articles ===");
  const articles = await client.execute("SELECT COUNT(*) as count FROM articles");
  console.log(articles.rows);

  console.log("\n=== Turso: Gallery Items ===");
  const gallery = await client.execute("SELECT COUNT(*) as count FROM gallery_items");
  console.log(gallery.rows);

  console.log("\n=== Turso: Page Content ===");
  const pageContent = await client.execute("SELECT COUNT(*) as count FROM page_content");
  console.log(pageContent.rows);
}

check();