CREATE TABLE `biblical_verses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(100) NOT NULL,
	`text` text NOT NULL,
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `biblical_verses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gallery_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(300) NOT NULL,
	`type` enum('image','video') NOT NULL,
	`mediaUrl` text NOT NULL,
	`mediaKey` text,
	`youtubeUrl` text,
	`verseId` int,
	`displayOrder` int NOT NULL DEFAULT 0,
	`featured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gallery_items_id` PRIMARY KEY(`id`)
);
