import cron from "node-cron";
import { getDb, listPublishedArticles } from "../db.js";
import { subscribers, type Subscriber } from "../../drizzle/schema.js";
import { sendWeeklyDigest } from "./newsletter.js";

export function initScheduler() {
  // Weekly digest: every Sunday at 8:00 AM (Europe/Paris)
  cron.schedule("0 8 * * 0", async () => {
    console.log("[Scheduler] Running weekly newsletter digest...");
    try {
      const db = getDb();
      const allSubscribers = await db.select().from(subscribers);
      const emails = allSubscribers.map((s: Subscriber) => s.email).filter(Boolean) as string[];

      if (emails.length === 0) {
        console.log("[Scheduler] No subscribers. Skipping digest.");
        return;
      }

      const articles = await listPublishedArticles();
      const recentArticles = articles.slice(0, 5);

      if (recentArticles.length === 0) {
        console.log("[Scheduler] No recent articles. Skipping digest.");
        return;
      }

      await sendWeeklyDigest(emails, recentArticles);
      console.log(`[Scheduler] Weekly digest sent to ${emails.length} subscribers.`);
    } catch (err) {
      console.error("[Scheduler] Weekly digest failed:", err);
    }
  }, {
    timezone: "Europe/Paris",
  });

  console.log("[Scheduler] Cron jobs initialized.");
}
