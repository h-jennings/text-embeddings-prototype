ALTER TABLE `jobs` ADD `external_job_id` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `jobs_external_job_id_unique` ON `jobs` (`external_job_id`);