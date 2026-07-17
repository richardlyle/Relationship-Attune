import { sql } from "drizzle-orm";
import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
