CREATE TABLE `companies` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`external_company_id` text NOT NULL,
	`platform_id` integer NOT NULL,
	FOREIGN KEY (`platform_id`) REFERENCES `platforms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `platforms` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `platforms_name_unique` ON `platforms` (`name`);--> statement-breakpoint
ALTER TABLE `jobs` ADD `company_id` integer NOT NULL REFERENCES companies(id);--> statement-breakpoint
CREATE INDEX `company_id_idx` ON `jobs` (`company_id`);