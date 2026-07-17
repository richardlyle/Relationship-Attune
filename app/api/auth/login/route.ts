import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { accounts } from "../../../../db/schema";
import { burnPasswordCheck, createSession, normalizeUsername, validPassword, validUsername, verifyPassword } from "../../../auth";

export const dynamic = "force-dynamic";

const MAX_FAILED_ATTEMPTS = 8;
const LOCK_MINUTES = 15;

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { username?: string; password?: string };
    const username = normalizeUsername(payload.username ?? "");
    const password = payload.password ?? "";
    if (!validUsername(username) || !validPassword(password)) {
      await burnPasswordCheck(password.slice(0, 128));
      return invalidCredentials();
    }

    const db = getDb();
    const [account] = await db.select().from(accounts).where(eq(accounts.username, username)).limit(1);
    if (!account) {
      await burnPasswordCheck(password);
      return invalidCredentials();
    }

    if (account.lockedUntil && account.lockedUntil > new Date().toISOString()) {
      await burnPasswordCheck(password);
      return invalidCredentials();
    }

    const valid = await verifyPassword(password, account.passwordHash, account.passwordSalt, account.passwordIterations);
    if (!valid) {
      const failedAttempts = account.failedAttempts + 1;
      const lockedUntil = failedAttempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString()
        : null;
      await db.update(accounts).set({
        failedAttempts: lockedUntil ? 0 : failedAttempts,
        lockedUntil,
        updatedAt: new Date().toISOString(),
      }).where(eq(accounts.id, account.id));
      return invalidCredentials();
    }

    await db.update(accounts).set({ failedAttempts: 0, lockedUntil: null, updatedAt: new Date().toISOString() })
      .where(eq(accounts.id, account.id));
    const response = noStore({ signedIn: true }, 200);
    response.headers.append("Set-Cookie", await createSession(account.id, request));
    return response;
  } catch (error) {
    console.error("Account sign-in failed", safeError(error));
    return noStore({ error: "We could not sign you in. Please try again." }, 500);
  }
}

function safeError(error: unknown) {
  return error instanceof Error ? { name: error.name, message: error.message } : { name: "UnknownError" };
}

function invalidCredentials() {
  return noStore({ error: "The username or password is incorrect." }, 401);
}

function noStore(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
