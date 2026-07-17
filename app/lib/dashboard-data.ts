import { and, desc, eq, ne } from "drizzle-orm";
import { getDb } from "../../db";
import { accounts, couples, profiles, quizResults } from "../../db/schema";
import type { AuthUser } from "../auth";

export async function ensureProfile(user: AuthUser) {
  const db = getDb();
  await db.insert(profiles).values({
    email: user.id,
    displayName: user.displayName,
    updatedAt: new Date().toISOString(),
  }).onConflictDoUpdate({
    target: profiles.email,
    set: { displayName: user.displayName, updatedAt: new Date().toISOString() },
  });
  const [profile] = await db.select().from(profiles).where(eq(profiles.email, user.id)).limit(1);
  return profile;
}

function toSavedResult(row: typeof quizResults.$inferSelect, ownerName?: string) {
  let care: string[] = [];
  try {
    const parsed = JSON.parse(row.careJson);
    if (Array.isArray(parsed)) care = parsed.filter((item): item is string => typeof item === "string");
  } catch {
    care = [];
  }
  return {
    quizSlug: row.quizSlug,
    primaryType: row.primaryType,
    quizTitle: row.quizTitle,
    profileTitle: row.profileTitle,
    summary: row.summary,
    care,
    completedAt: row.completedAt,
    ownerName,
  };
}

export async function getDashboard(user: AuthUser) {
  const db = getDb();
  const profile = await ensureProfile(user);
  const ownRows = await db.select().from(quizResults)
    .where(eq(quizResults.ownerEmail, user.id))
    .orderBy(desc(quizResults.completedAt));
  const [account] = await db.select({
    email: accounts.email,
    emailVerifiedAt: accounts.emailVerifiedAt,
    weeklyEmailEnabled: accounts.weeklyEmailEnabled,
    emailTimezone: accounts.emailTimezone,
  }).from(accounts).where(eq(accounts.id, user.id)).limit(1);


  let couple = null;
  if (profile.coupleId) {
    const [coupleRow] = await db.select().from(couples).where(eq(couples.id, profile.coupleId)).limit(1);
    const [partner] = await db.select().from(profiles)
      .where(and(eq(profiles.coupleId, profile.coupleId), ne(profiles.email, user.id)))
      .limit(1);
    const partnerRows = partner
      ? await db.select().from(quizResults)
          .where(eq(quizResults.ownerEmail, partner.email))
          .orderBy(desc(quizResults.completedAt))
      : [];
    couple = coupleRow ? {
      inviteCode: coupleRow.inviteCode,
      partnerName: partner?.displayName ?? null,
      partnerResults: partnerRows.map((row) => toSavedResult(row, partner?.displayName)),
    } : null;
  }

  return {
    displayName: profile.displayName,
    couple,
    results: ownRows.map((row) => toSavedResult(row, profile.displayName)),
    pairNotes: {
      email: account?.email ?? null,
      emailVerified: Boolean(account?.emailVerifiedAt),
      weeklyEmailEnabled: Boolean(account?.weeklyEmailEnabled),
      emailTimezone: account?.emailTimezone ?? "America/New_York",
      active: Boolean(account?.email && account?.emailVerifiedAt && account?.weeklyEmailEnabled),
    },
  };
}

export function makeInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}


