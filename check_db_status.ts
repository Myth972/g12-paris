import "dotenv/config";
import { getDb } from './server/db';
import { sql } from 'drizzle-orm';

async function checkUsers() {
  const db = await getDb();
  if (!db) {
    console.error("Database not found");
    return;
  }
  
  try {
    const res: any = await db.run(sql`SELECT * FROM users`);
    console.log("Users in database:");
    console.log(JSON.stringify(res.rows || res, null, 2));
    
    const pageCount: any = await db.run(sql`SELECT count(*) as count FROM page_content`);
    console.log("\nPage Content Count:", pageCount.rows?.[0]?.count ?? pageCount[0]?.count);

    const articleCount: any = await db.run(sql`SELECT count(*) as count FROM articles`);
    console.log("Articles Count:", articleCount.rows?.[0]?.count ?? articleCount[0]?.count);
  } catch (err) {
    console.error("Error querying database:", err);
  }
}

checkUsers().catch(console.error);
