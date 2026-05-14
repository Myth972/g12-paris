CREATE TABLE `page_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` varchar(100) NOT NULL,
	`contentType` enum('image','youtube_video','mp4_video') NOT NULL,
	`title` varchar(300) NOT NULL,
	`mediaUrl` text NOT NULL,
	`mediaKey` text,
	`youtubeUrl` text,
	`displayOrder` int NOT NULL DEFAULT 0,
	`visible` boolean NOT NULL DEFAULT true,
	`description` text,
	`authorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `page_content_id` PRIMARY KEY(`id`)
);
