import {
  sqliteTable,
  integer,
  text,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * User profiles for personalization tracking
 */
export const userProfiles = sqliteTable(
  "user_profiles",
  {
    id: text("id").primaryKey(),
    userId: integer("userId"),
    preferences: text("preferences").default("{}").notNull(), // JSON: {themes, categories, languages}
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("user_profiles_user_id_idx").on(table.userId),
    createdAtIdx: index("user_profiles_created_at_idx").on(table.createdAt),
  })
);

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Track user activities (views, clicks, time spent)
 */
export const userActivities = sqliteTable(
  "user_activities",
  {
    id: text("id").primaryKey(),
    userId: integer("userId"),
    articleId: integer("articleId"),
    action: text("action").notNull(), // 'view', 'read', 'click', 'share', 'scroll'
    durationMs: integer("durationMs"), // Time spent on article in ms
    metadata: text("metadata").default("{}").notNull(), // Additional data as JSON
    timestamp: integer("timestamp", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("user_activities_user_id_idx").on(table.userId),
    articleIdIdx: index("user_activities_article_id_idx").on(table.articleId),
    actionIdx: index("user_activities_action_idx").on(table.action),
    timestampIdx: index("user_activities_timestamp_idx").on(table.timestamp),
  })
);

export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = typeof userActivities.$inferInsert;

/**
 * Category interest scores per user
 */
export const categoryInterests = sqliteTable(
  "category_interests",
  {
    id: text("id").primaryKey(),
    userId: integer("userId").notNull(),
    category: text("category").notNull(),
    score: real("score").default(0).notNull(), // 0-100
    viewCount: integer("viewCount").default(0).notNull(),
    lastUpdated: integer("lastUpdated", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
  },
  (table) => ({
    userCategoryIdx: uniqueIndex("category_interests_user_category_idx").on(
      table.userId,
      table.category
    ),
    userIdIdx: index("category_interests_user_id_idx").on(table.userId),
    scoreIdx: index("category_interests_score_idx").on(table.score),
  })
);

export type CategoryInterest = typeof categoryInterests.$inferSelect;
export type InsertCategoryInterest = typeof categoryInterests.$inferInsert;

/**
 * Cached recommendations per user
 */
export const recommendationsCache = sqliteTable(
  "recommendations_cache",
  {
    id: text("id").primaryKey(),
    userId: integer("userId").notNull(),
    recommendedArticleIds: text("recommendedArticleIds").notNull(), // JSON array
    scores: text("scores").notNull(), // JSON object with scores
    expiresAt: integer("expiresAt", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now', '+5 minutes'))`)
      .notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("recommendations_cache_user_id_idx").on(table.userId),
    expiresAtIdx: index("recommendations_cache_expires_at_idx").on(
      table.expiresAt
    ),
  })
);

export type RecommendationsCache = typeof recommendationsCache.$inferSelect;
export type InsertRecommendationsCache =
  typeof recommendationsCache.$inferInsert;

/**
 * User layouts - customized layout configurations
 */
export const userLayouts = sqliteTable(
  "user_layouts",
  {
    id: text("id").primaryKey(),
    userId: integer("userId").notNull(),
    layoutName: text("layoutName").notNull(),
    layoutType: text("layoutType").notNull(), // 'grid', 'list', 'magazine', 'timeline', 'custom'
    config: text("config").notNull(), // JSON: {sections: [{id, type, position, size, settings}]}
    isActive: integer("isActive", { mode: "boolean" }).default(false).notNull(),
    isDefault: integer("isDefault", { mode: "boolean" })
      .default(false)
      .notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("user_layouts_user_id_idx").on(table.userId),
    layoutTypeIdx: index("user_layouts_layout_type_idx").on(table.layoutType),
    isActiveIdx: index("user_layouts_is_active_idx").on(table.isActive),
    isDefaultIdx: index("user_layouts_is_default_idx").on(table.isDefault),
  })
);

export type UserLayout = typeof userLayouts.$inferSelect;
export type InsertUserLayout = typeof userLayouts.$inferInsert;

/**
 * Pre-defined layout templates
 */
export const layoutTemplates = sqliteTable(
  "layout_templates",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    layoutType: text("layoutType").notNull(),
    config: text("config").notNull(), // JSON: layout configuration
    previewImage: text("previewImage"), // URL to preview image
    isFeatured: integer("isFeatured", { mode: "boolean" })
      .default(false)
      .notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
  },
  (table) => ({
    layoutTypeIdx: index("layout_templates_layout_type_idx").on(
      table.layoutType
    ),
    isFeaturedIdx: index("layout_templates_is_featured_idx").on(
      table.isFeatured
    ),
  })
);

export type LayoutTemplate = typeof layoutTemplates.$inferSelect;
export type InsertLayoutTemplate = typeof layoutTemplates.$inferInsert;

/**
 * Layout change history
 */
export const layoutChanges = sqliteTable(
  "layout_changes",
  {
    id: text("id").primaryKey(),
    userId: integer("userId").notNull(),
    layoutId: text("layoutId").notNull(),
    changeType: text("changeType").notNull(), // 'created', 'updated', 'deleted'
    changes: text("changes").notNull(), // JSON object with what changed
    timestamp: integer("timestamp", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("layout_changes_user_id_idx").on(table.userId),
    layoutIdIdx: index("layout_changes_layout_id_idx").on(table.layoutId),
    timestampIdx: index("layout_changes_timestamp_idx").on(table.timestamp),
  })
);

export type LayoutChange = typeof layoutChanges.$inferSelect;
export type InsertLayoutChange = typeof layoutChanges.$inferInsert;
