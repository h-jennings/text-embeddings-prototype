PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tags` (
	`id` integer PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`vector` text DEFAULT '[]'
);
--> statement-breakpoint
INSERT INTO `__new_tags`("id", "created_at", "updated_at", "name", "description", "vector") SELECT "id", "created_at", "updated_at", "name", "description", "vector" FROM `tags`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
ALTER TABLE `__new_tags` RENAME TO `tags`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);