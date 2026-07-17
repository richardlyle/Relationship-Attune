import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { accounts } from "../../../../db/schema";
import { createOpaqueToken, createSession, hashOpaqueToken, hashPassword, normalizeUsername, validPassword, validUsername } from "../../../auth";
import { normalizeEmail, publicOrigin, sendVerificationEmail, validEmail, validTimezone, verificationExpiresAt } from "../../../lib/pair-notes";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { username?: string; password?: string; email?: string; weeklyEmailEnabled?: boolean; emailTimezone?: string };
    const username = normalizeUsername(payload.username ?? "");
    const password = payload.password ?? "";
    const email = normalizeEmail(payload.email ?? "");
    const weeklyEmailEnabled = Boolean(payload.weeklyEmailEnabled);
    if (!validUsername(username)) {
      return noStore({ error: "Use 3–24 letters, numbers, dots, dashes, or underscores." }, 400);
    }
    if (!validPassword(password)) {
      return noStore({ error: "Use a password between 12 and 128 characters." }, 400);
    }
    if (email && !validEmail(email)) return noStore({ error: "Enter a valid email address." }, 400);
    if (weeklyEmailEnabled && !email) return noStore({ error: "Add an email address to receive PAIR Notes." }, 400);
    if (!validTimezone(payload.emailTimezone ?? "America/New_York")) return noStore({ error: "Choose a supported time zone." }, 400);

    const db = getDb();
    const [existing] = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.username, username)).limit(1);
    if (existing) return noStore({ error: "That username is already taken." }, 409);

    const passwordRecord = await hashPassword(password);
    const id = crypto.randomUUID();
    const verificationToken = weeklyEmailEnabled && email ? createOpaqueToken() : null;
    const emailTimezone = payload.emailTimezone ?? "America/New_York";
    await db.insert(accounts).values({
      id,
      username,
      displayName: username,
      passwordHash: passwordRecord.hash,
      passwordSalt: passwordRecord.salt,
      email: email || null,
      weeklyEmailEnabled: Boolean(email && weeklyEmailEnabled),
      emailTimezone,
      emailVerificationTokenHash: verificationToken ? await hashOpaqueToken(verificationToken) : null,
      emailVerificationExpiresAt: verificationToken ? verificationExpiresAt() : null,
      passwordIterations: passwordRecord.iterations,
      updatedAt: new Date().toISOString(),
    });
    let verificationSent = false;
    if (verificationToken) {
      try {
        const delivery = await sendVerificationEmail(email, verificationToken, publicOrigin(request.url));
        verificationSent = delivery.configured;
      } catch {
        verificationSent = false;
      }
    }

    const response = noStore({ signedIn: true, verificationSent }, 201);
    response.headers.append("Set-Cookie", await createSession(id, request));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/unique/i.test(message)) return noStore({ error: "That username or email is already connected to an account." }, 409);
    console.error("Account registration failed", safeError(error));
    return noStore({ error: "We could not create that account. Please try again." }, 500);
  }
}

function safeError(error: unknown) {
  return error instanceof Error ? { name: error.name, message: error.message } : { name: "UnknownError" };
}

function noStore(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
