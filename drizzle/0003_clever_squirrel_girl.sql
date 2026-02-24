CREATE TABLE `category_interests` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` integer NOT NULL,
	`category` text NOT NULL,
	`score` real DEFAULT 0 NOT NULL,
	`viewCount` integer DEFAULT 0 NOT NULL,
	`lastUpdated` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_interests_user_category_idx` ON `category_interests` (`userId`,`category`);
--> statement-breakpoint
CREATE INDEX `category_interests_user_id_idx` ON `category_interests` (`userId`);
--> statement-breakpoint
CREATE INDEX `category_interests_score_idx` ON `category_interests` (`score`);
--> statement-breakpoint
CREATE TABLE `layout_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` integer NOT NULL,
	`layoutId` text NOT NULL,
	`changeType` text NOT NULL,
	`changes` text NOT NULL,
	`timestamp` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `layout_changes_user_id_idx` ON `layout_changes` (`userId`);
--> statement-breakpoint
CREATE INDEX `layout_changes_layout_id_idx` ON `layout_changes` (`layoutId`);
--> statement-breakpoint
CREATE INDEX `layout_changes_timestamp_idx` ON `layout_changes` (`timestamp`);
--> statement-breakpoint
CREATE TABLE `layout_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`layoutType` text NOT NULL,
	`config` text NOT NULL,
	`previewImage` text,
	`isFeatured` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `layout_templates_layout_type_idx` ON `layout_templates` (`layoutType`);
--> statement-breakpoint
CREATE INDEX `layout_templates_is_featured_idx` ON `layout_templates` (`isFeatured`);
--> statement-breakpoint
CREATE TABLE `recommendations_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` integer NOT NULL,
	`recommendedArticleIds` text NOT NULL,
	`scores` text NOT NULL,
	`expiresAt` integer DEFAULT (strftime('%s', 'now', '+5 minutes')) NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `recommendations_cache_user_id_idx` ON `recommendations_cache` (`userId`);
--> statement-breakpoint
CREATE INDEX `recommendations_cache_expires_at_idx` ON `recommendations_cache` (`expiresAt`);
--> statement-breakpoint
CREATE TABLE `user_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` integer,
	`articleId` integer,
	`action` text NOT NULL,
	`durationMs` integer,
	`metadata` text DEFAULT '{}' NOT NULL,
	`timestamp` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `user_activities_user_id_idx` ON `user_activities` (`userId`);
--> statement-breakpoint
CREATE INDEX `user_activities_article_id_idx` ON `user_activities` (`articleId`);
--> statement-breakpoint
CREATE INDEX `user_activities_action_idx` ON `user_activities` (`action`);
--> statement-breakpoint
CREATE INDEX `user_activities_timestamp_idx` ON `user_activities` (`timestamp`);
--> statement-breakpoint
CREATE TABLE `user_layouts` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` integer NOT NULL,
	`layoutName` text NOT NULL,
	`layoutType` text NOT NULL,
	`config` text NOT NULL,
	`isActive` integer DEFAULT false NOT NULL,
	`isDefault` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `user_layouts_user_id_idx` ON `user_layouts` (`userId`);
--> statement-breakpoint
CREATE INDEX `user_layouts_layout_type_idx` ON `user_layouts` (`layoutType`);
--> statement-breakpoint
CREATE INDEX `user_layouts_is_active_idx` ON `user_layouts` (`isActive`);
--> statement-breakpoint
CREATE INDEX `user_layouts_is_default_idx` ON `user_layouts` (`isDefault`);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` integer,
	`preferences` text DEFAULT '{}' NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `user_profiles_user_id_idx` ON `user_profiles` (`userId`);
--> statement-breakpoint
CREATE INDEX `user_profiles_created_at_idx` ON `user_profiles` (`createdAt`);
