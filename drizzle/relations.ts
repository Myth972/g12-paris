import { relations } from "drizzle-orm";
import { users, articles, galleries, publications, notifications, notificationReads, pages } from "./schema";

// Relations pour la table users
export const usersRelations = relations(users, ({ many }) => ({
  articles: many(articles),
  notifications: many(notifications),
  notificationReads: many(notificationReads),
}));

// Relations pour la table articles
export const articlesRelations = relations(articles, ({ one }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
}));

// Relations pour la table galleries
export const galleriesRelations = relations(galleries, ({}) => ({}));

// Relations pour la table publications
export const publicationsRelations = relations(publications, ({}) => ({}));

// Relations pour la table notifications
export const notificationsRelations = relations(notifications, ({ one, many }) => ({
  author: one(users, {
    fields: [notifications.authorId],
    references: [users.id],
  }),
  reads: many(notificationReads),
}));

// Relations pour la table notification_reads
export const notificationReadsRelations = relations(notificationReads, ({ one }) => ({
  notification: one(notifications, {
    fields: [notificationReads.notificationId],
    references: [notifications.id],
  }),
  user: one(users, {
    fields: [notificationReads.userId],
    references: [users.id],
  }),
}));

// Relations pour la table pages
export const pagesRelations = relations(pages, ({}) => ({}));