CREATE TABLE `jobs` (
	`id` integer PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `jobs_url_unique` ON `jobs` (`url`);--> statement-breakpoint
CREATE TABLE `tags_to_jobs` (
	`tag_id` integer,
	`job_id` integer,
	PRIMARY KEY(`tag_id`, `job_id`),
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action
);
