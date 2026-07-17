import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { accounts } from "../../../../db/schema";
import { createOpaqueToken, getCurrentUser, hashOpaqueToken } from "../../../auth";
import {
  normalizeEmail,
  publicOrigin,
  sendVerificationEmail,
  validEmail,
  validTimezone,
  verificationExpiresAt,
} from "../../../lib/pair-notes";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return noStore({ error: "Sign in required." }, 401);

  try {
    const payload = await request.json() as { email?: string; weeklyEmailEnabled?: boolean; emailTimezone?: string };
    const email = normalizeEmail(payload.email ?? "");
    const weeklyEmailEnabled = Boolean(payload.weeklyEmailEnabled);
    const emailTimezone = payload.emailTimezone ?? "America/New_York";
    if (email && !validEmail(email)) return noStore({ error: "Enter a valid email address." }, 400);
    if (weeklyEmailEnabled && !email) return noStore({ error: "Add an email address before turning on PAIR Notes." }, 400);
    if (!validTimezone(emailTimezone)) return noStore({ error: "Choose a supported time zone." }, 400);

    const db = getDb();
    const [account] = await db.select().from(accounts).where(eq(accounts.id, user.id)).limit(1);
    if (!account) return noStore({ error: "Account not found." }, 404);

    const emailChanged = (account.email ?? "") !== email;
    const needsVerification = Boolean(email && weeklyEmailEnabled && (emailChanged || !account.emailVerifiedAt));
    const verificationToken = needsVerification ? createOpaqueToken() : null;
    await db.update(accounts).set({
      email: email || null,
      emailVerifiedAt: emailChanged ? null : account.emailVerifiedAt,
      weeklyEmailEnabled: email ? weeklyEmailEnabled : false,
      emailTimezone,
      emailVerificationTokenHash: verificationToken ? await hashOpaqueToken(verificationToken) : (emailChanged ? null : account.emailVerificationTokenHash),
      emailVerificationExpiresAt: verificationToken ? verificationExpiresAt() : (emailChanged ? null : account.emailVerificationExpiresAt),
      unsubscribeTokenHash: emailChanged ? null : account.unsubscribeTokenHash,
      updatedAt: new Date().toISOString(),
    }).where(eq(accounts.id, user.id));

    let verificationSent = false;
    let deliveryConfigured = false;
    if (verificationToken) {
      try {
        const delivery = await sendVerificationEmail(email, verificationToken, publicOrigin(request.url));
        verificationSent = delivery.configured;
        deliveryConfigured = delivery.configured;
      } catch {
        deliveryConfigured = true;
      }
    }

    const verified = Boolean(!emailChanged && account.emailVerifiedAt);
    return noStore({
      saved: true,
      pairNotes: {
        email: email || null,
        emailVerified: verified,
        weeklyEmailEnabled: email ? weeklyEmailEnabled : false,
        emailTimezone,
        active: Boolean(email && weeklyEmailEnabled && verified),
      },
      verificationSent,
      deliveryConfigured,
    }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/unique/i.test(message)) return noStore({ error: "That email address is already connected to another account." }, 409);
    return noStore({ error: "We could not save your email settings. Please try again." }, 500);
  }
}

function noStore(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
