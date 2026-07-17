import { env } from "cloudflare:workers";
import { and, desc, eq, isNotNull, ne } from "drizzle-orm";
import { getDb } from "../../../../db";
import { accounts, profiles, quizResults, weeklyEmailHistory } from "../../../../db/schema";
import { createOpaqueToken, hashOpaqueToken } from "../../../auth";
import { emailDeliveryConfigured } from "../../../lib/email-delivery";
import {
  mondayWeekKey,
  publicOrigin,
  selectNextPairNote,
  sendWeeklyPairNote,
  type PairNoteSource,
} from "../../../lib/pair-notes";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const configuredSecret = env.PAIR_NOTES_CRON_SECRET?.trim();
  const suppliedSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!configuredSecret || suppliedSecret !== configuredSecret) {
    return noStore({ error: "Not authorized." }, 401);
  }
  if (!emailDeliveryConfigured()) {
    return noStore({ error: "Email delivery is not configured." }, 503);
  }

  const payload = await request.json().catch(() => ({})) as { force?: boolean };
  const force = payload.force === true;
  const now = new Date();
  const weekKey = mondayWeekKey(now);
  const db = getDb();
  const recipients = await db.select({
    id: accounts.id,
    email: accounts.email,
    displayName: accounts.displayName,
    emailTimezone: accounts.emailTimezone,
  }).from(accounts).where(and(
    eq(accounts.weeklyEmailEnabled, true),
    isNotNull(accounts.email),
    isNotNull(accounts.emailVerifiedAt),
  ));

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const recipient of recipients) {
    if (!recipient.email || (!force && !isMondayAtEight(now, recipient.emailTimezone))) {
      skipped += 1;
      continue;
    }

    let reservationId: string | null = null;
    try {
      const [recipientProfile] = await db.select().from(profiles).where(eq(profiles.email, recipient.id)).limit(1);
      if (!recipientProfile?.coupleId) {
        skipped += 1;
        continue;
      }
      const [partner] = await db.select().from(profiles).where(and(
        eq(profiles.coupleId, recipientProfile.coupleId),
        ne(profiles.email, recipient.id),
      )).limit(1);
      if (!partner) {
        skipped += 1;
        continue;
      }

      const resultRows = await db.select().from(quizResults)
        .where(eq(quizResults.ownerEmail, partner.email))
        .orderBy(desc(quizResults.completedAt));
      const sources: PairNoteSource[] = resultRows.map((row) => ({
        quizSlug: row.quizSlug,
        primaryType: row.primaryType,
        quizTitle: row.quizTitle,
        profileTitle: row.profileTitle,
        summary: row.summary,
        care: parseCare(row.careJson),
      }));
      const history = await db.select({ tipKey: weeklyEmailHistory.tipKey, sentAt: weeklyEmailHistory.sentAt })
        .from(weeklyEmailHistory)
        .where(eq(weeklyEmailHistory.recipientAccountId, recipient.id))
        .orderBy(desc(weeklyEmailHistory.sentAt));
      const note = selectNextPairNote(sources, history);
      if (!note) {
        skipped += 1;
        continue;
      }

      reservationId = crypto.randomUUID();
      const reserved = await db.insert(weeklyEmailHistory).values({
        id: reservationId,
        recipientAccountId: recipient.id,
        partnerAccountId: partner.email,
        weekKey,
        tipKey: note.tipKey,
        tipText: note.tipText,
        sourceQuizTitle: note.quizTitle,
        sourceProfileTitle: note.profileTitle,
      }).onConflictDoNothing().returning({ id: weeklyEmailHistory.id });
      if (!reserved.length) {
        reservationId = null;
        skipped += 1;
        continue;
      }

      const unsubscribeToken = createOpaqueToken();
      await db.update(accounts).set({ unsubscribeTokenHash: await hashOpaqueToken(unsubscribeToken) })
        .where(eq(accounts.id, recipient.id));
      const delivery = await sendWeeklyPairNote({
        to: recipient.email,
        recipientName: recipient.displayName,
        partnerName: partner.displayName,
        note,
        origin: publicOrigin(request.url),
        unsubscribeToken,
      });
      if (!delivery.configured || !delivery.id) throw new Error("Email delivery is unavailable.");
      await db.update(weeklyEmailHistory).set({
        status: "sent",
        providerMessageId: delivery.id,
        sentAt: new Date().toISOString(),
      }).where(eq(weeklyEmailHistory.id, reservationId));
      sent += 1;
    } catch {
      failed += 1;
      if (reservationId) await db.delete(weeklyEmailHistory).where(eq(weeklyEmailHistory.id, reservationId));
    }
  }

  return noStore({ sent, skipped, failed, weekKey }, failed ? 207 : 200);
}

function parseCare(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function isMondayAtEight(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);
  return parts.find((part) => part.type === "weekday")?.value === "Mon"
    && Number(parts.find((part) => part.type === "hour")?.value) === 8;
}

function noStore(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
