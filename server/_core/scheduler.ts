import cron from "node-cron";
import { getDb, listPublishedArticles } from "../db.js";
import { subscribers, type Subscriber } from "../../drizzle/schema.js";
import { sendWeeklyDigest } from "./newsletter.js";

export interface DigestResult {
  status: "sent" | "skipped";
  reason?: string;
  recipients?: number;
  articles?: number;
}

/**
 * Envoie le digest hebdomadaire.
 *
 * Fonction partagée entre :
 *  - le cron node-cron (serveur autonome / développement)
 *  - la route /api/cron/newsletter (Vercel Cron)
 *
 * Sur Vercel, `initScheduler()` n'est jamais appelé : un serveurless
 * s'arrête à chaque requête, node-cron n'a donc aucune durée de vie.
 * C'est Vercel Cron qui déclenche cette fonction en production.
 */
export async function runWeeklyDigest(subject?: string): Promise<DigestResult> {
  const db = getDb();
  if (!db) {
    return { status: "skipped", reason: "database unavailable" };
  }

  const allSubscribers = await db.select().from(subscribers);
  const emails = allSubscribers
    .map((s: Subscriber) => s.email)
    .filter(Boolean) as string[];

  if (emails.length === 0) {
    return { status: "skipped", reason: "no subscribers" };
  }

  const articles = await listPublishedArticles();
  const recentArticles = articles.slice(0, 5);

  if (recentArticles.length === 0) {
    return { status: "skipped", reason: "no recent articles" };
  }

  await sendWeeklyDigest(emails, recentArticles, subject);

  return {
    status: "sent",
    recipients: emails.length,
    articles: recentArticles.length,
  };
}

export function initScheduler() {
  // Digest hebdomadaire : dimanche 8h00 (Europe/Paris).
  // Ne s'exécute que sur le serveur autonome (dev / self-hosted).
  // En production Vercel, c'est la route /api/cron/newsletter qui joue ce rôle.
  cron.schedule(
    "0 8 * * 0",
    async () => {
      console.log("[Scheduler] Running weekly newsletter digest...");
      try {
        const result = await runWeeklyDigest();
        if (result.status === "skipped") {
          console.log(`[Scheduler] Digest skipped: ${result.reason}`);
        } else {
          console.log(
            `[Scheduler] Digest sent to ${result.recipients} subscribers ` +
              `(${result.articles} articles).`
          );
        }
      } catch (err) {
        console.error("[Scheduler] Weekly digest failed:", err);
      }
    },
    { timezone: "Europe/Paris" }
  );

  console.log("[Scheduler] Cron jobs initialized.");
}
