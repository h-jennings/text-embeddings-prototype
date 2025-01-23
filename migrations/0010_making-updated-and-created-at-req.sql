PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_companies` (
	`id` integer PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`name` text NOT NULL,
	`external_company_id` text NOT NULL,
	`platform_id` integer NOT NULL,
	FOREIGN KEY (`platform_id`) REFERENCES `platforms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_companies`("id", "created_at", "updated_at", "name", "external_company_id", "platform_id") SELECT "id", "created_at", "updated_at", "name", "external_company_id", "platform_id" FROM `companies`;--> statement-breakpoint
DROP TABLE `companies`;--> statement-breakpoint
ALTER TABLE `__new_companies` RENAME TO `companies`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_jobs` (
	`id` integer PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`external_job_id` text NOT NULL,
	`external_job_url` text NOT NULL,
	`ai_summary` text,
	`ai_summary_vector` text,
	`company_id` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_jobs`("id", "created_at", "updated_at", "url", "title", "description", "external_job_id", "external_job_url", "ai_summary", "ai_summary_vector", "company_id") SELECT "id", "created_at", "updated_at", "url", "title", "description", "external_job_id", "external_job_url", "ai_summary", "ai_summary_vector", "company_id" FROM `jobs`;--> statement-breakpoint
DROP TABLE `jobs`;--> statement-breakpoint
ALTER TABLE `__new_jobs` RENAME TO `jobs`;--> statement-breakpoint
CREATE UNIQUE INDEX `jobs_url_unique` ON `jobs` (`url`);--> statement-breakpoint
CREATE UNIQUE INDEX `jobs_external_job_id_unique` ON `jobs` (`external_job_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `jobs_external_job_url_unique` ON `jobs` (`external_job_url`);--> statement-breakpoint
CREATE INDEX `company_id_idx` ON `jobs` (`company_id`);--> statement-breakpoint
CREATE TABLE `__new_platforms` (
	`id` integer PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_platforms`("id", "created_at", "updated_at", "name") SELECT "id", "created_at", "updated_at", "name" FROM `platforms`;--> statement-breakpoint
DROP TABLE `platforms`;--> statement-breakpoint
ALTER TABLE `__new_platforms` RENAME TO `platforms`;--> statement-breakpoint
CREATE UNIQUE INDEX `platforms_name_unique` ON `platforms` (`name`);--> statement-breakpoint
CREATE TABLE `__new_tags` (
	`id` integer PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`vector` text
);
--> statement-breakpoint
INSERT INTO `__new_tags`("id", "created_at", "updated_at", "name", "description", "vector") SELECT "id", "created_at", "updated_at", "name", "description", "vector" FROM `tags`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
ALTER TABLE `__new_tags` RENAME TO `tags`;