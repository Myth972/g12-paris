CREATE TABLE `page_contents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pageId` text NOT NULL,
	`fieldName` text NOT NULL,
	`content` text NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `page_contents_page_field_unique` ON `page_contents` (`pageId`,`fieldName`);--> statement-breakpoint
CREATE INDEX `page_contents_page_id_idx` ON `page_contents` (`pageId`);