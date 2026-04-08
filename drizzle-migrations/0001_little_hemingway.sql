CREATE TABLE `subscribers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscribers_email_unique` ON `subscribers` (`email`);--> statement-breakpoint
ALTER TABLE `articles` ADD `verseId` integer;--> statement-breakpoint
ALTER TABLE `page_content` ADD `featuredHome` integer DEFAULT false NOT NULL;