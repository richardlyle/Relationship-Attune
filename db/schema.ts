import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email").unique(),
  emailVerifiedAt: text("email_verified_at"),
  weeklyEmailEnabled: integer("weekly_email_enabled", { mode: "boolean" }).notNull().default(false),
  emailTimezone: text("email_timezone").notNull().default("America/New_York"),
  emailVerificationTokenHash: text("email_verification_token_hash"),
  emailVerificationExpiresAt: text("email_verification_expires_at"),
  unsubscribeTokenHash: text("unsubscribe_token_hash"),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  passwordIterations: integer("password_iterations").notNull().default(100000),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: text("locked_until"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text("expires_at").notNull(),
}, (table) => [
  index("sessions_account_id_idx").on(table.accountId),
  index("sessions_expires_at_idx").on(table.expiresAt),
]);

export const couples = sqliteTable("couples", {
  id: text("id").primaryKey(),
  inviteCode: text("invite_code").notNull().unique(),
  createdByEmail: text("created_by_email").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const profiles = sqliteTable("profiles", {
  email: text("email").primaryKey(),
  displayName: text("display_name").notNull(),
  coupleId: text("couple_id").references(() => couples.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("profiles_couple_id_idx").on(table.coupleId)]);

export const quizResults = sqliteTable("quiz_results", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull().references(() => profiles.email, { onDelete: "cascade" }),
  quizSlug: text("quiz_slug").notNull(),
  primaryType: text("primary_type").notNull(),
  quizTitle: text("quiz_title").notNull(),
  profileTitle: text("profile_title").notNull(),
  summary: text("summary").notNull(),
  careJson: text("care_json").notNull(),
  completedAt: text("completed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("quiz_results_owner_quiz_idx").on(table.ownerEmail, table.quizSlug),
  index("quiz_results_owner_idx").on(table.ownerEmail),
]);

export const weeklyEmailHistory = sqliteTable("weekly_email_history", {
  id: text("id").primaryKey(),
  recipientAccountId: text("recipient_account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  partnerAccountId: text("partner_account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  weekKey: text("week_key").notNull(),
  tipKey: text("tip_key").notNull(),
  tipText: text("tip_text").notNull(),
  sourceQuizTitle: text("source_quiz_title").notNull(),
  sourceProfileTitle: text("source_profile_title").notNull(),
  status: text("status").notNull().default("pending"),
  providerMessageId: text("provider_message_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  sentAt: text("sent_at"),
}, (table) => [
  uniqueIndex("weekly_email_history_recipient_week_idx").on(table.recipientAccountId, table.weekKey),
  index("weekly_email_history_recipient_tip_idx").on(table.recipientAccountId, table.tipKey),
]);
