-- Custom SQL migration file, put your code below! --
UPDATE companies SET
  created_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP;
--> statement-breakpoint

UPDATE jobs SET
  created_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP;
--> statement-breakpoint

UPDATE tags SET
  created_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP;
--> statement-breakpoint

UPDATE platforms SET
  created_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP;
--> statement-breakpoint