CREATE TABLE `limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`white_token` text NOT NULL,
	`black_token` text,
	`white_name` text NOT NULL,
	`black_name` text,
	`version` integer DEFAULT 0 NOT NULL,
	`expires` integer NOT NULL,
	`white_seen` integer NOT NULL,
	`black_seen` integer DEFAULT 0 NOT NULL
);
