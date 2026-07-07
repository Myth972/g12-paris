import { eq, desc, and, sql, asc, notInArray, inArray, count } from "drizzle-orm";
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
  categories,
  themes,
  type InsertCategory,
  type InsertTheme,
  galleryItems,
  biblicalVerses,
  pageContent,
  announcements,
} from "../drizzle/schema.js";
import { ENV } from "./_core/env.js";
import { TRPCError } from "@trpc/server";

function assertDb(db: unknown): asserts db {
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }
}

let _db: any = null;

export function getDb() {
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
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "User openId is required for upsert",
    });
  }

  const db = getDb();
  assertDb(db);

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
  const db = getDb();
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
  const db = getDb();
  assertDb(db);

  const [row] = await db.insert(articles).values(data).returning();
  return row;
}

export async function updateArticle(
  id: number,
  data: Partial<Omit<InsertArticle, "id" | "createdAt" | "updatedAt">>
) {
  const db = getDb();
  assertDb(db);

  await db.update(articles).set(data).where(eq(articles.id, id));
  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  return rows[0];
}

export async function deleteArticle(id: number) {
  const db = getDb();
  assertDb(db);

  await db.delete(articles).where(eq(articles.id, id));
  return { success: true };
}

export async function getArticleById(id: number) {
  const db = getDb();
  assertDb(db);

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
  const db = getDb();
  assertDb(db);

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
  filters: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    type?: string;
    theme?: string;
    sort?: string;
  } = {}
) {
  const db = getDb();
  assertDb(db);

  const conditions = [eq(articles.published, true)];
  
  if (filters.category && filters.category !== "all") {
    if (filters.category === "bibliothèque") {
       conditions.push(sql`${articles.category} LIKE 'bibliothèque:%'`);
    } else {
       conditions.push(sql`${articles.category} LIKE ${filters.category + '%'}`);
    }
  }

  if (filters.search) {
    const s = `%${filters.search}%`;
    conditions.push(sql`(${articles.title} LIKE ${s} OR ${articles.content} LIKE ${s})`);
  }

  if (filters.type) {
    conditions.push(sql`${articles.category} LIKE ${`bibliothèque:${filters.type}%`}`);
  }

  if (filters.theme) {
    conditions.push(sql`${articles.category} LIKE ${`%:${filters.theme}%`}`);
  }

  if (filters.minPrice !== undefined) {
    conditions.push(sql`${articles.price} >= ${filters.minPrice}`);
  }

  if (filters.maxPrice !== undefined) {
    conditions.push(sql`${articles.price} <= ${filters.maxPrice}`);
  }

  let orderBy: any = desc(articles.createdAt);
  if (filters.sort === "price_asc") {
    orderBy = articles.price;
  } else if (filters.sort === "price_desc") {
    orderBy = desc(articles.price);
  } else if (filters.sort === "popular") {
    orderBy = desc(articles.createdAt);
  }

  const rows = await db
    .select({
      article: articles,
      authorName: users.name,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  return rows.map((r: any) => ({ ...r.article, authorName: r.authorName }));
}

export async function countPublishedArticles(filters: {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: string;
  theme?: string;
} = {}) {
  const db = getDb();
  assertDb(db);

  const conditions = [eq(articles.published, true)];
  
  if (filters.category && filters.category !== "all") {
    if (filters.category === "bibliothèque") {
       conditions.push(sql`${articles.category} LIKE 'bibliothèque:%'`);
    } else {
       conditions.push(sql`${articles.category} LIKE ${filters.category + '%'}`);
    }
  }

  if (filters.search) {
    const s = `%${filters.search}%`;
    conditions.push(sql`(${articles.title} LIKE ${s} OR ${articles.content} LIKE ${s})`);
  }

  if (filters.type) {
    conditions.push(sql`${articles.category} LIKE ${`bibliothèque:${filters.type}:%`}`);
  }

  if (filters.theme) {
    conditions.push(sql`${articles.category} LIKE ${`%:${filters.theme}%`}`);
  }

  if (filters.minPrice !== undefined) {
    conditions.push(sql`${articles.price} >= ${filters.minPrice}`);
  }

  if (filters.maxPrice !== undefined) {
    conditions.push(sql`${articles.price} <= ${filters.maxPrice}`);
  }

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(and(...conditions));

  return rows[0]?.count ?? 0;
}

export async function listAllArticles(limit = 50, offset = 0) {
  const db = getDb();
  assertDb(db);

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
  const db = getDb();
  assertDb(db);

  const rows = await db.select({ count: sql<number>`count(*)` }).from(articles);
  return rows[0]?.count ?? 0;
}

// ─── Notification helpers ───────────────────────────────────────

export async function createNotification(
  data: Omit<InsertNotification, "id" | "createdAt">
) {
  const db = getDb();
  assertDb(db);

  const [row] = await db.insert(notifications).values(data).returning();
  return row;
}

export async function deleteNotification(id: number) {
  const db = getDb();
  assertDb(db);

  await db
    .delete(notificationReads)
    .where(eq(notificationReads.notificationId, id));
  await db.delete(notifications).where(eq(notifications.id, id));
  return { success: true };
}

export async function listNotifications(limit = 50, offset = 0) {
  const db = getDb();
  assertDb(db);

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
  const db = getDb();
  assertDb(db);

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications);
  return rows[0]?.count ?? 0;
}

export async function getUserNotifications(userId: number, limit = 20) {
  const db = getDb();
  assertDb(db);

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
  const db = getDb();
  assertDb(db);

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .leftJoin(
      notificationReads,
      and(
        eq(notificationReads.notificationId, notifications.id),
        eq(notificationReads.userId, userId)
      )
    )
    .where(sql`${notificationReads.id} IS NULL`);

  return rows[0]?.count ?? 0;
}

export async function markNotificationAsRead(
  notificationId: number,
  userId: number
) {
  const db = getDb();
  assertDb(db);

  try {
    await db.insert(notificationReads).values({
      notificationId,
      userId,
    });
    return { success: true, alreadyRead: false };
  } catch {
    return { success: true, alreadyRead: true };
  }
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = getDb();
  assertDb(db);

  const result = await db.run(sql`
    INSERT INTO notification_reads (notificationId, userId, readAt)
    SELECT id, ${userId}, strftime('%s', 'now')
    FROM notifications
    WHERE id NOT IN (
      SELECT notificationId FROM notification_reads WHERE userId = ${userId}
    )
  `);

  const count = result.meta?.rows_written ?? 0;
  return { success: true, count };
}

// ─── Gallery helpers ────────────────────────────────────────────

export async function getFeaturedGalleryItems() {
  const db = getDb();
  assertDb(db);

  const rows = await db
    .select({
      item: galleryItems,
      verse: biblicalVerses,
    })
    .from(galleryItems)
    .leftJoin(biblicalVerses, eq(galleryItems.verseId, biblicalVerses.id))
    .where(eq(galleryItems.featured, true))
    .orderBy(galleryItems.displayOrder)
    .limit(50);

  return rows.map((r: any) => ({
    ...r.item,
    verse: r.verse,
  }));
}

export async function getGalleryItemById(id: number) {
  const db = getDb();
  assertDb(db);

  const [row] = await db
    .select()
    .from(galleryItems)
    .where(eq(galleryItems.id, id))
    .limit(1);
  return row ?? null;
}

export async function getAllGalleryItems(limit = 50, offset = 0, visibleOnly = true, category?: string) {
  const db = getDb();
  assertDb(db);

  const conditions = [];
  if (visibleOnly) {
    conditions.push(eq(galleryItems.visible, true));
  }
  if (category) {
    conditions.push(eq(galleryItems.category, category));
  }

  const rows = await db
    .select({
      item: galleryItems,
      verse: biblicalVerses,
    })
    .from(galleryItems)
    .leftJoin(biblicalVerses, eq(galleryItems.verseId, biblicalVerses.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(galleryItems.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((r: any) => ({
    ...r.item,
    verse: r.verse,
  }));
}

export async function countGalleryItems(visibleOnly = true, category?: string) {
  const db = getDb();
  assertDb(db);

  const conditions = [];
  if (visibleOnly) {
    conditions.push(eq(galleryItems.visible, true));
  }
  if (category) {
    conditions.push(eq(galleryItems.category, category));
  }

  const [row] = await db
    .select({ total: count() })
    .from(galleryItems)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return row?.total ?? 0;
}

export async function createGalleryItem(data: any) {
  const db = getDb();
  assertDb(db);

  const [row] = await db.insert(galleryItems).values(data).returning();
  return row;
}

export async function updateGalleryItem(id: number, data: Partial<{ title: string; visible: boolean; featured: boolean; loop: boolean; verseId: number | null; category: string; mediaUrl: string; mediaKey: string; youtubeUrl: string; coverImageUrl: string; coverImageKey: string }>) {
  const db = getDb();
  assertDb(db);

  const [row] = await db
    .update(galleryItems)
    .set({ ...data, updatedAt: sql`(strftime('%s', 'now'))` })
    .where(eq(galleryItems.id, id))
    .returning();
  return row;
}

export async function deleteGalleryItem(id: number) {
  const db = getDb();
  assertDb(db);

  await db.delete(galleryItems).where(eq(galleryItems.id, id));
  return { success: true };
}

export async function getFeaturedHomeContent() {
  const db = getDb();
  assertDb(db);

  const rows = await db
    .select()
    .from(pageContent)
    .where(
      and(eq(pageContent.featuredHome, true), eq(pageContent.visible, true))
    )
    .orderBy(desc(pageContent.createdAt));

  return rows;
}

// ─── Biblical Verse helpers ─────────────────────────────────────

export async function createBiblicalVerse(data: any) {
  const db = getDb();
  assertDb(db);

  const [row] = await db.insert(biblicalVerses).values(data).returning();
  return row;
}

export async function getBiblicalVerseById(id: number) {
  const db = getDb();
  assertDb(db);

  const rows = await db
    .select()
    .from(biblicalVerses)
    .where(eq(biblicalVerses.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function getLatestBiblicalVerse() {
  const db = getDb();
  assertDb(db);

  const rows = await db
    .select()
    .from(biblicalVerses)
    .orderBy(desc(biblicalVerses.createdAt))
    .limit(1);
  return rows[0] || null;
}

export async function listBiblicalVerses(limit = 50, offset = 0) {
  const db = getDb();
  assertDb(db);

  const rows = await db
    .select()
    .from(biblicalVerses)
    .orderBy(desc(biblicalVerses.createdAt))
    .limit(limit)
    .offset(offset);
  return rows;
}

export async function updateBiblicalVerse(
  id: number,
  data: Partial<{
    reference: string;
    text: string;
    summary: string;
    imageUrl: string | null;
  }>
) {
  const db = getDb();
  assertDb(db);

  const sanitized: Record<string, unknown> = {};
  if (data.reference !== undefined) sanitized.reference = data.reference;
  if (data.text !== undefined) sanitized.text = data.text;
  if (data.summary !== undefined) sanitized.summary = data.summary;
  if (data.imageUrl !== undefined) sanitized.imageUrl = data.imageUrl;

  const [row] = await db
    .update(biblicalVerses)
    .set(sanitized)
    .where(eq(biblicalVerses.id, id))
    .returning();
  return row;
}

export async function deleteBiblicalVerse(id: number) {
  const db = getDb();
  assertDb(db);

  await db
    .update(galleryItems)
    .set({ verseId: null })
    .where(eq(galleryItems.verseId, id));
  await db.delete(biblicalVerses).where(eq(biblicalVerses.id, id));

  return { success: true };
}

// ─── Page Content helpers ───────────────────────────────────────

export async function getPageContent(pageId: string) {
  const db = getDb();
  assertDb(db);

  const rows = await db
    .select()
    .from(pageContent)
    .where(and(eq(pageContent.pageId, pageId), eq(pageContent.visible, true)))
    .orderBy(pageContent.displayOrder);

  return rows;
}

export async function createPageContent(data: any) {
  const db = getDb();
  assertDb(db);

  const [row] = await db.insert(pageContent).values(data).returning();
  return row;
}

export async function updatePageContent(id: number, data: any) {
  const db = getDb();
  assertDb(db);

  await db.update(pageContent).set(data).where(eq(pageContent.id, id));
  const rows = await db
    .select()
    .from(pageContent)
    .where(eq(pageContent.id, id))
    .limit(1);
  return rows[0];
}

export async function deletePageContent(id: number) {
  const db = getDb();
  assertDb(db);

  await db.delete(pageContent).where(eq(pageContent.id, id));
  return { success: true };
}

export async function listPageContent(pageId: string, limit = 50, offset = 0) {
  const db = getDb();
  assertDb(db);

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
  const db = getDb();
  assertDb(db);

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(pageContent)
    .where(eq(pageContent.pageId, pageId));

  return rows[0]?.count ?? 0;
}

// ─── Categories & Themes helpers ────────────────────────────────

export async function listCategories() {
  const db = getDb();
  assertDb(db);
  return db.select().from(categories).orderBy(categories.name);
}

export async function createCategory(data: InsertCategory) {
  const db = getDb();
  assertDb(db);
  const { id: _id, ...insertData } = data as any;
  const [row] = await db.insert(categories).values(insertData).returning();
  return row;
}

export async function deleteCategory(id: number) {
  const db = getDb();
  assertDb(db);
  await db.delete(themes).where(eq(themes.categoryId, id));
  await db.delete(categories).where(eq(categories.id, id));
  return { success: true };
}

export async function listThemes(categoryId?: number) {
  const db = getDb();
  assertDb(db);
  let query = db.select().from(themes);
  if (categoryId) {
    query = query.where(eq(themes.categoryId, categoryId)) as any;
  }
  return query.orderBy(themes.name);
}

export async function createTheme(data: InsertTheme) {
  const db = getDb();
  assertDb(db);
  const { id: _id, ...insertData } = data as any;
  const [row] = await db.insert(themes).values(insertData).returning();
  return row;
}

export async function deleteTheme(id: number) {
  const db = getDb();
  assertDb(db);
  await db.delete(themes).where(eq(themes.id, id));
  return { success: true };
}

// ─── User Functions ───────────────────────────────────────────────

export async function findUserByPassword(password: string) {
  const db = getDb();
  assertDb(db);

  const result = await db
    .select()
    .from(users)
    .where(eq(users.password, password))
    .limit(1);

  if (result.length === 0) return null;
  
  const user = result[0];
  if (user.openId === "admin-local") return null;
  
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  return user;
}

export async function findUserByUsernameAndPassword(username: string, password: string) {
  const db = getDb();
  assertDb(db);

  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.name, username), eq(users.password, password)))
    .limit(1);

  if (result.length === 0) return null;
  
  const user = result[0];
  if (user.openId === "admin-local") return null;
  
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  return user;
}

export async function updateUserPassword(userId: number, password: string) {
  const db = getDb();
  assertDb(db);

  await db
    .update(users)
    .set({ password, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function getUserById(id: number) {
  const db = getDb();
  assertDb(db);

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function verifyUserPasswordById(userId: number, password: string) {
  const db = getDb();
  assertDb(db);

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) return false;
  
  const user = result[0];
  if (!user.password || user.password !== password) return false;
  
  return true;
}

export async function listAllUsers() {
  const db = getDb();
  assertDb(db);
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function createUser(data: { openId: string; name: string; email?: string; role: string; password?: string; loginMethod?: string }) {
  const db = getDb();
  assertDb(db);
  const [row] = await db.insert(users).values({
    openId: data.openId,
    name: data.name,
    email: data.email,
    role: data.role,
    password: data.password,
    loginMethod: data.loginMethod,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return row;
}

export async function updateUserRole(userId: number, role: string) {
  const db = getDb();
  assertDb(db);

  const validRoles = ["user", "admin", "editeur", "bibliotheque"];
  if (!validRoles.includes(role)) {
    throw new Error(`Rôle invalide: ${role}`);
  }

  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function deleteUser(id: number) {
  const db = getDb();
  assertDb(db);

  const [adminCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.role, "admin"));
  const adminCount = adminCountRow?.count ?? 0;
  const user = await getUserById(id);
  
  if (user?.role === "admin" && adminCount <= 1) {
    throw new Error("Impossible de supprimer le dernier administrateur");
  }

  await db.delete(users).where(eq(users.id, id));
  return { success: true };
}

export async function upsertUserFromAuth(data: { openId: string; name: string; role: string; lastSignedIn?: Date }) {
  const db = getDb();
  assertDb(db);

  const existing = await db.select().from(users).where(eq(users.openId, data.openId)).limit(1);
  
  if (existing.length > 0) {
    await db.update(users).set({
      name: data.name,
      role: data.role,
      lastSignedIn: data.lastSignedIn,
      updatedAt: new Date(),
    }).where(eq(users.id, existing[0].id));
    return existing[0];
  }
  
  const [row] = await db.insert(users).values({
    openId: data.openId,
    name: data.name,
    role: data.role,
    lastSignedIn: data.lastSignedIn,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return row;
}

// ─── Announcements CRUD ─────────────────────────────────────────

export async function listAnnouncements(type?: string) {
  const db = getDb();
  assertDb(db);

  const conditions = [eq(announcements.visible, true)];
  if (type) conditions.push(eq(announcements.type, type));

  return db
    .select()
    .from(announcements)
    .where(and(...conditions))
    .orderBy(asc(announcements.displayOrder));
}

export async function adminListAnnouncements(type?: string) {
  const db = getDb();
  assertDb(db);

  const conditions: any[] = [];
  if (type) conditions.push(eq(announcements.type, type));

  return db
    .select()
    .from(announcements)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(announcements.createdAt));
}

export async function createAnnouncement(data: any) {
  const db = getDb();
  assertDb(db);

  const [row] = await db.insert(announcements).values(data).returning();
  return row;
}

export async function updateAnnouncement(id: number, data: any) {
  const db = getDb();
  assertDb(db);

  await db.update(announcements).set({ ...data, updatedAt: new Date() }).where(eq(announcements.id, id));
  const [row] = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
  return row;
}

export async function deleteAnnouncement(id: number) {
  const db = getDb();
  assertDb(db);

  await db.delete(announcements).where(eq(announcements.id, id));
  return { success: true };
}
