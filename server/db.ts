import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import {
  InsertUser,
  users,
  articles,
  type InsertArticle,
  notifications,
  notificationReads,
  type InsertNotification,
} from "../drizzle/schema.js";
import { notInArray, inArray } from "drizzle-orm";
import { ENV } from "./_core/env.js";

let _db: any = null;

export async function getDb() {
  if (
    !_db &&
    (process.env.DATABASE_URL ||
      (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN))
  ) {
    try {
      const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL!;
      const authToken = process.env.TURSO_AUTH_TOKEN;
      const client = createClient({ url, authToken });
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

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }

    // Always update updatedAt on upsert if it exists in schema
    const now = new Date();
    values.updatedAt = now;
    updateSet.updatedAt = now;

    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = now;
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = now;
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
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

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Article helpers ────────────────────────────────────────────

export async function createArticle(
  data: Omit<InsertArticle, "id" | "createdAt" | "updatedAt">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [row] = await db.insert(articles).values(data).returning();
  return row;
}

export async function updateArticle(
  id: number,
  data: Partial<Omit<InsertArticle, "id" | "createdAt" | "updatedAt">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(articles).set(data).where(eq(articles.id, id));
  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  return rows[0];
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

export async function listPublishedArticles(
  limit = 20,
  offset = 0,
  category?: string
) {
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

  return rows.map((r: any) => ({ ...r.article, authorName: r.authorName }));
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

  return rows.map((r: any) => ({ ...r.article, authorName: r.authorName }));
}

export async function countAllArticles() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db.select({ count: sql<number>`count(*)` }).from(articles);
  return rows[0]?.count ?? 0;
}

// ─── Notification helpers ───────────────────────────────────────

export async function createNotification(
  data: Omit<InsertNotification, "id" | "createdAt">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [row] = await db.insert(notifications).values(data).returning();
  return row;
}

export async function deleteNotification(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete associated reads first
  await db
    .delete(notificationReads)
    .where(eq(notificationReads.notificationId, id));
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

  return rows.map((r: any) => ({
    ...r.notification,
    authorName: r.authorName,
  }));
}

export async function countNotifications() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications);
  return rows[0]?.count ?? 0;
}

export async function getUserNotifications(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all notifications with read status for this user
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

  return rows.map((r: any) => ({
    ...r.notification,
    authorName: r.authorName,
    isRead: r.readAt !== null,
    readAt: r.readAt,
  }));
}

export async function countUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get IDs of notifications this user has read
  const readRows = await db
    .select({ notificationId: notificationReads.notificationId })
    .from(notificationReads)
    .where(eq(notificationReads.userId, userId));

  const readIds = readRows.map((r: any) => r.notificationId);

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

export async function markNotificationAsRead(
  notificationId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already read
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

  // Get all notification IDs
  const allNotifs = await db
    .select({ id: notifications.id })
    .from(notifications);
  const allIds = allNotifs.map((n: any) => n.id);

  if (allIds.length === 0) return { success: true, count: 0 };

  // Get already read IDs
  const readRows = await db
    .select({ notificationId: notificationReads.notificationId })
    .from(notificationReads)
    .where(
      and(
        eq(notificationReads.userId, userId),
        inArray(notificationReads.notificationId, allIds)
      )
    );

  const readIds = new Set(readRows.map((r: any) => r.notificationId));
  const unreadIds = allIds.filter((id: any) => !readIds.has(id));

  if (unreadIds.length === 0) return { success: true, count: 0 };

  await db.insert(notificationReads).values(
    unreadIds.map((notificationId: any) => ({
      notificationId,
      userId,
    }))
  );

  return { success: true, count: unreadIds.length };
}

// ─── Gallery helpers ────────────────────────────────────────────

export async function getFeaturedGalleryItems() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { galleryItems, biblicalVerses } = await import("../drizzle/schema.js");

  const rows = await db
    .select({
      item: galleryItems,
      verse: biblicalVerses,
    })
    .from(galleryItems)
    .leftJoin(biblicalVerses, eq(galleryItems.verseId, biblicalVerses.id))
    .where(eq(galleryItems.featured, true))
    .orderBy(galleryItems.displayOrder)
    .limit(4);

  return rows.map((r: any) => ({
    ...r.item,
    verse: r.verse,
  }));
}

export async function getAllGalleryItems(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { galleryItems, biblicalVerses } = await import("../drizzle/schema.js");

  const rows = await db
    .select({
      item: galleryItems,
      verse: biblicalVerses,
    })
    .from(galleryItems)
    .leftJoin(biblicalVerses, eq(galleryItems.verseId, biblicalVerses.id))
    .orderBy(desc(galleryItems.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((r: any) => ({
    ...r.item,
    verse: r.verse,
  }));
}

export async function createGalleryItem(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { galleryItems } = await import("../drizzle/schema.js");

  const [row] = await db.insert(galleryItems).values(data).returning();
  return row;
}

export async function deleteGalleryItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { galleryItems } = await import("../drizzle/schema.js");

  await db.delete(galleryItems).where(eq(galleryItems.id, id));
  return { success: true };
}

export async function getFeaturedHomeContent() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { pageContent } = await import("../drizzle/schema.js");

  const rows = await db
    .select()
    .from(pageContent)
    .where(and(eq(pageContent.featuredHome, true), eq(pageContent.visible, true)))
    .orderBy(desc(pageContent.createdAt));

  return rows;
}

// ─── Biblical Verse helpers ─────────────────────────────────────

export async function createBiblicalVerse(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { biblicalVerses } = await import("../drizzle/schema.js");

  const [row] = await db.insert(biblicalVerses).values(data).returning();
  return row;
}

export async function getBiblicalVerseById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { biblicalVerses } = await import("../drizzle/schema.js");

  const rows = await db
    .select()
    .from(biblicalVerses)
    .where(eq(biblicalVerses.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function getLatestBiblicalVerse() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { biblicalVerses } = await import("../drizzle/schema.js");

  const rows = await db
    .select()
    .from(biblicalVerses)
    .orderBy(desc(biblicalVerses.createdAt))
    .limit(1);
  return rows[0] || null;
}

export async function listBiblicalVerses() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { biblicalVerses } = await import("../drizzle/schema.js");

  const rows = await db
    .select()
    .from(biblicalVerses)
    .orderBy(desc(biblicalVerses.createdAt));
  return rows;
}

export async function deleteBiblicalVerse(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { biblicalVerses, galleryItems } = await import("../drizzle/schema.js");

  // First update gallery_items to clear the verseId
  await db
    .update(galleryItems)
    .set({ verseId: null })
    .where(eq(galleryItems.verseId, id));
  // Then delete the verse
  await db.delete(biblicalVerses).where(eq(biblicalVerses.id, id));

  return { success: true };
}

// ─── Page Content helpers ───────────────────────────────────────

export async function getPageContent(pageId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { pageContent } = await import("../drizzle/schema.js");

  const rows = await db
    .select()
    .from(pageContent)
    .where(and(eq(pageContent.pageId, pageId), eq(pageContent.visible, true)))
    .orderBy(pageContent.displayOrder);

  return rows;
}

export async function createPageContent(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { pageContent } = await import("../drizzle/schema.js");

  const [row] = await db.insert(pageContent).values(data).returning();
  return row;
}

export async function updatePageContent(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { pageContent } = await import("../drizzle/schema.js");

  await db.update(pageContent).set(data).where(eq(pageContent.id, id));
  const rows = await db
    .select()
    .from(pageContent)
    .where(eq(pageContent.id, id))
    .limit(1);
  return rows[0];
}

export async function deletePageContent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { pageContent } = await import("../drizzle/schema.js");

  await db.delete(pageContent).where(eq(pageContent.id, id));
  return { success: true };
}

export async function listPageContent(pageId: string, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { pageContent } = await import("../drizzle/schema.js");

  const rows = await db
    .select()
    .from(pageContent)
    .where(eq(pageContent.pageId, pageId))
    .orderBy(desc(pageContent.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
}

export async function countPageContent(pageId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { pageContent } = await import("../drizzle/schema.js");

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(pageContent)
    .where(eq(pageContent.pageId, pageId));

  return rows[0]?.count ?? 0;
}
