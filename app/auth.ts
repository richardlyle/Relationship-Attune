import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "../db";
import { accounts, sessions } from "../db/schema";

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
};

export const SESSION_COOKIE = "between_us_session";
// Cloudflare Workers currently caps a single PBKDF2 deriveBits operation at
// 100,000 iterations. The iteration count is stored with each account so this
// can be raised later without invalidating existing passwords.
export const PASSWORD_ITERATIONS = 100_000;
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const encoder = new TextEncoder();

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function validUsername(value: string) {
  return /^[a-z0-9][a-z0-9._-]{2,23}$/.test(value);
}

export function validPassword(value: string) {
  return value.length >= 12 && value.length <= 128;
}

export async function hashPassword(password: string, salt = randomBytes(16), iterations = PASSWORD_ITERATIONS) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
  return { hash: bytesToBase64(new Uint8Array(bits)), salt: bytesToBase64(salt), iterations };
}

export async function verifyPassword(password: string, expectedHash: string, salt: string, iterations: number) {
  const candidate = await hashPassword(password, base64ToBytes(salt), iterations);
  return constantTimeEqual(base64ToBytes(candidate.hash), base64ToBytes(expectedHash));
}

export async function burnPasswordCheck(password: string) {
  const result = await hashPassword(password, new Uint8Array(16), PASSWORD_ITERATIONS);
  return constantTimeEqual(base64ToBytes(result.hash), new Uint8Array(32));
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  const [row] = await getDb().select({
    id: accounts.id,
    username: accounts.username,
    displayName: accounts.displayName,
  }).from(sessions)
    .innerJoin(accounts, eq(accounts.id, sessions.accountId))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)))
    .limit(1);
  return row ?? null;
}

export async function createSession(accountId: string, request: Request) {
  const token = createOpaqueToken();
  const tokenHash = await hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
  const db = getDb();
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date().toISOString()));
  await db.insert(sessions).values({ tokenHash, accountId, expiresAt });
  return sessionCookie(token, SESSION_MAX_AGE_SECONDS, new URL(request.url).protocol === "https:");
}

export async function deleteSession(request: Request) {
  const token = readCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (token) await getDb().delete(sessions).where(eq(sessions.tokenHash, await hashOpaqueToken(token)));
  return sessionCookie("", 0, new URL(request.url).protocol === "https:");
}

function sessionCookie(value: string, maxAge: number, secure: boolean) {
  return [`${SESSION_COOKIE}=${value}`, "Path=/", `Max-Age=${maxAge}`, "HttpOnly", "SameSite=Lax", secure ? "Secure" : ""]
    .filter(Boolean).join("; ");
}

function readCookie(header: string | null, name: string) {
  if (!header) return null;
  for (const item of header.split(";")) {
    const [key, ...parts] = item.trim().split("=");
    if (key === name) return parts.join("=");
  }
  return null;
}

export function createOpaqueToken() {
  return bytesToBase64Url(randomBytes(32));
}

export async function hashOpaqueToken(value: string) {
  return sha256(value);
}

async function sha256(value: string) {
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

function randomBytes(length: number) {
  return crypto.getRandomValues(new Uint8Array(length));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function bytesToBase64Url(bytes: Uint8Array) {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
