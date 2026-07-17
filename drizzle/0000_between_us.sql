CREATE TABLE `couples` (
  `id` text PRIMARY KEY NOT NULL,
  `invite_code` text NOT NULL,
  `created_by_email` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `couples_invite_code_unique` ON `couples` (`invite_code`);
--> statement-breakpoint
CREATE TABLE `profiles` (
  `email` text PRIMARY KEY NOT NULL,
  `display_name` text NOT NULL,
  `couple_id` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`couple_id`) REFERENCES `couples`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `profiles_couple_id_idx` ON `profiles` (`couple_id`);
--> statement-breakpoint
CREATE TABLE `quiz_results` (
  `id` text PRIMARY KEY NOT NULL,
  `owner_email` text NOT NULL,
  `quiz_slug` text NOT NULL,
  `primary_type` text NOT NULL,
  `quiz_title` text NOT NULL,
  `profile_title` text NOT NULL,
  `summary` text NOT NULL,
  `care_json` text NOT NULL,
  `completed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`owner_email`) REFERENCES `profiles`(`email`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quiz_results_owner_quiz_idx` ON `quiz_results` (`owner_email`,`quiz_slug`);
--> statement-breakpoint
CREATE INDEX `quiz_results_owner_idx` ON `quiz_results` (`owner_email`);