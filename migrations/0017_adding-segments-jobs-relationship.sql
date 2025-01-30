CREATE TABLE `segments_to_jobs` (
	`segment_id` integer,
	`job_id` integer,
	PRIMARY KEY(`segment_id`, `job_id`),
	FOREIGN KEY (`segment_id`) REFERENCES `segments`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE cascade ON DELETE cascade
);
