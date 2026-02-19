import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { InsertUser, users, articles, type InsertArticle, notifications, notificationReads, type InsertNotification } from "../drizzle/schema";
import { notInArray, inArray } from "drizzle-orm";
import { ENV } from './_core/env';

// Use Turso (libsql) for production, or a local file for development
const DATABASE_URL = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:sqlite.db";
const DATABASE_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    try {
      const client = createClient({
        url: DATABASE_URL,
        authToken: DATABASE_AUTH_TOKEN,
      });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ───────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  // Determine role
  const role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  const lastSignedIn = user.lastSignedIn ?? new Date();

  try {
    await db.insert(users).values({
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      role,
      lastSignedIn,
    }).onConflictDoUpdate({
      target: users.openId,
      set: {
        name: user.name ?? sql`excluded.name`,
        email: user.email ?? sql`excluded.email`,
        loginMethod: user.loginMethod ?? sql`excluded.loginMethod`,
        role: sql`excluded.role`,
        lastSignedIn: sql`excluded.lastSignedIn`,
      },
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Article helpers ────────────────────────────────────────────

export async function createArticle(data: Omit<InsertArticle, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(articles).values(data).returning();
  return result[0];
}

export async function updateArticle(id: number, data: Partial<Omit<InsertArticle, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.update(articles).set(data).where(eq(articles.id, id)).returning();
  return result[0];
}

export async function deleteArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(articles).where(eq(articles.id, id));
  return { success: true };
}

export async function getArticleById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select({
      article: articles,
      authorName: users.name,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(eq(articles.id, id))
    .limit(1);

  if (rows.length === 0) return null;
  return { ...rows[0].article, authorName: rows[0].authorName };
}

export async function getArticleBySlug(slug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select({
      article: articles,
      authorName: users.name,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(eq(articles.slug, slug))
    .limit(1);

  if (rows.length === 0) return null;
  return { ...rows[0].article, authorName: rows[0].authorName };
}

export async function listPublishedArticles(limit = 20, offset = 0, category?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(articles.published, true)];
  if (category && category !== "all") {
    conditions.push(eq(articles.category, category));
  }

  const rows = await db
    .select({
      article: articles,
      authorName: users.name,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(and(...conditions))
    .orderBy(desc(articles.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map(r => ({ ...r.article, authorName: r.authorName }));
}

export async function countPublishedArticles(category?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(articles.published, true)];
  if (category && category !== "all") {
    conditions.push(eq(articles.category, category));
  }

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(and(...conditions));

  return rows[0]?.count ?? 0;
}

export async function listAllArticles(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select({
      article: articles,
      authorName: users.name,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .orderBy(desc(articles.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map(r => ({ ...r.article, authorName: r.authorName }));
}

export async function countAllArticles() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db.select({ count: sql<number>`count(*)` }).from(articles);
  return rows[0]?.count ?? 0;
}

// ─── Notification helpers ───────────────────────────────────────

export async function createNotification(data: Omit<InsertNotification, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notifications).values(data).returning();
  return result[0];
}

export async function deleteNotification(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(notificationReads).where(eq(notificationReads.notificationId, id));
  await db.delete(notifications).where(eq(notifications.id, id));
  return { success: true };
}

export async function listNotifications(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select({
      notification: notifications,
      authorName: users.name,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.authorId, users.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map(r => ({ ...r.notification, authorName: r.authorName }));
}

export async function countNotifications() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db.select({ count: sql<number>`count(*)` }).from(notifications);
  return rows[0]?.count ?? 0;
}

export async function getUserNotifications(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select({
      notification: notifications,
      authorName: users.name,
      readAt: notificationReads.readAt,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.authorId, users.id))
    .leftJoin(
      notificationReads,
      and(
        eq(notificationReads.notificationId, notifications.id),
        eq(notificationReads.userId, userId)
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return rows.map(r => ({
    ...r.notification,
    authorName: r.authorName,
    isRead: r.readAt !== null,
    readAt: r.readAt,
  }));
}

export async function countUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const readRows = await db
    .select({ notificationId: notificationReads.notificationId })
    .from(notificationReads)
    .where(eq(notificationReads.userId, userId));

  const readIds = readRows.map(r => r.notificationId);

  let countRows;
  if (readIds.length > 0) {
    countRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(notInArray(notifications.id, readIds));
  } else {
    countRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications);
  }

  return countRows[0]?.count ?? 0;
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(notificationReads)
    .where(
      and(
        eq(notificationReads.notificationId, notificationId),
        eq(notificationReads.userId, userId)
      )
    )
    .limit(1);

  if (existing.length > 0) return { success: true, alreadyRead: true };

  await db.insert(notificationReads).values({
    notificationId,
    userId,
  });

  return { success: true, alreadyRead: false };
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allNotifs = await db.select({ id: notifications.id }).from(notifications);
  const allIds = allNotifs.map(n => n.id);

  if (allIds.length === 0) return { success: true, count: 0 };

  const readRows = await db
    .select({ notificationId: notificationReads.notificationId })
    .from(notificationReads)
    .where(
      and(
        eq(notificationReads.userId, userId),
        inArray(notificationReads.notificationId, allIds)
      )
    );

  const readIds = new Set(readRows.map(r => r.notificationId));
  const unreadIds = allIds.filter(id => !readIds.has(id));

  if (unreadIds.length === 0) return { success: true, count: 0 };

  await db.insert(notificationReads).values(
    unreadIds.map(notificationId => ({
      notificationId,
      userId,
    }))
  );

  return { success: true, count: unreadIds.length };
}
