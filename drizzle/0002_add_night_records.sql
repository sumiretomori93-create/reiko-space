CREATE TABLE `night_records` (
	`id` integer PRIMARY KEY NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
