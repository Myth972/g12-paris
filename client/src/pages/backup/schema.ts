import {
  sqliteTable,
  integer,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(),
  password: text("password"), // Mot de passe optionnel (pour connexion locale)
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Articles table for news content.
 */
export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImageUrl: text("coverImageUrl"),
  coverImageKey: text("coverImageKey"),
  youtubeUrl: text("youtubeUrl"),
  verseId: integer("verseId"),
  category: text("category").default("actualité").notNull(),
  published: integer("published", { mode: "boolean" }).default(false).notNull(),
  authorId: integer("authorId").notNull(),
  price: integer("price"), // Price in cents
  meta: text("meta"), // JSON for extra data (author, publisher, etc.)
  affiliateUrl: text("affiliateUrl"), // External affiliate purchase link (Amazon, etc.)
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

/**
 * Notifications table.
 */
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("info").notNull(),
  linkUrl: text("linkUrl"),
  authorId: integer("authorId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Tracks which user has read which notification.
 */
export const notificationReads = sqliteTable("notification_reads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  notificationId: integer("notificationId").notNull(),
  userId: integer("userId").notNull(),
  readAt: integer("readAt", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

export type NotificationRead = typeof notificationReads.$inferSelect;
export type InsertNotificationRead = typeof notificationReads.$inferInsert;

/**
 * Gallery items (images and videos) for the "Publication du jour" page.
 */
export const galleryItems = sqliteTable("gallery_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  type: text("type").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mediaKey: text("mediaKey"),
  youtubeUrl: text("youtubeUrl"),
  verseId: integer("verseId"),
  displayOrder: integer("displayOrder").default(0).notNull(),
  visible: integer("visible", { mode: "boolean" }).default(true).notNull(),
  featured: integer("featured", { mode: "boolean" }).default(false).notNull(),
  loop: integer("loop", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

export type GalleryItem = typeof galleryItems.$inferSelect;
export type InsertGalleryItem = typeof galleryItems.$inferInsert;

/**
 * Biblical verses with summaries.
 */
export const biblicalVerses = sqliteTable("biblical_verses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: text("reference").notNull(),
  text: text("text").notNull(),
  summary: text("summary").notNull(),
  imageUrl: text("imageUrl"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

export type BiblicalVerse = typeof biblicalVerses.$inferSelect;
export type InsertBiblicalVerse = typeof biblicalVerses.$inferInsert;

/**
 * Page content customization for all pages.
 */
export const pageContent = sqliteTable("page_content", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pageId: text("pageId").notNull(),
  contentType: text("contentType").notNull(),
  title: text("title").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mediaKey: text("mediaKey"),
  youtubeUrl: text("youtubeUrl"),
  displayOrder: integer("displayOrder").default(0).notNull(),
  visible: integer("visible", { mode: "boolean" }).default(true).notNull(),
  loop: integer("loop", { mode: "boolean" }).default(false).notNull(),
  featuredHome: integer("featuredHome", { mode: "boolean" })
    .default(false)
    .notNull(),
  description: text("description"),
  authorId: integer("authorId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

export type PageContent = typeof pageContent.$inferSelect;
export type InsertPageContent = typeof pageContent.$inferInsert;

export const subscribers = sqliteTable("subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = typeof subscribers.$inferInsert;

export const siteSettings = sqliteTable("site_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

/**
 * Categories for articles and media.
 */
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Themes for articles and media, linked to categories.
 */
export const themes = sqliteTable("themes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  categoryId: integer("categoryId").references(() => categories.id),
  description: text("description"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

export type Theme = typeof themes.$inferSelect;
export type InsertTheme = typeof themes.$inferInsert;

export const userTheme = sqliteTable("user_theme", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").notNull().default("light"),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});
export type UserTheme = typeof userTheme.$inferSelect;
export type InsertUserTheme = typeof userTheme.$inferInsert;
