ALTER TABLE `accounts` ADD `email` text;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `email_verified_at` text;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `weekly_email_enabled` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `email_timezone` text DEFAULT 'America/New_York' NOT NULL;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `email_verification_token_hash` text;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `email_verification_expires_at` text;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `unsubscribe_token_hash` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_email_unique` ON `accounts` (`email`);
--> statement-breakpoint
CREATE TABLE `weekly_email_history` (
  `id` text PRIMARY KEY NOT NULL,
  `recipient_account_id` text NOT NULL,
  `partner_account_id` text NOT NULL,
  `week_key` text NOT NULL,
  `tip_key` text NOT NULL,
  `tip_text` text NOT NULL,
  `source_quiz_title` text NOT NULL,
  `source_profile_title` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `provider_message_id` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `sent_at` text,
  FOREIGN KEY (`recipient_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`partner_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weekly_email_history_recipient_week_idx` ON `weekly_email_history` (`recipient_account_id`,`week_key`);
--> statement-breakpoint
CREATE INDEX `weekly_email_history_recipient_tip_idx` ON `weekly_email_history` (`recipient_account_id`,`tip_key`);
