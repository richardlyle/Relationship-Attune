import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { accounts } from "../../../../db/schema";
import { hashOpaqueToken } from "../../../auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (token.length < 20) return page("That unsubscribe link is not valid.", request.url, 400);

  const tokenHash = await hashOpaqueToken(token);
  const db = getDb();
  const [account] = await db.select({ id: accounts.id }).from(accounts)
    .where(eq(accounts.unsubscribeTokenHash, tokenHash)).limit(1);
  if (!account) return page("This link has expired, or PAIR Notes are already turned off.", request.url, 400);

  await db.update(accounts).set({
    weeklyEmailEnabled: false,
    unsubscribeTokenHash: null,
    updatedAt: new Date().toISOString(),
  }).where(eq(accounts.id, account.id));
  return page("You are unsubscribed from weekly PAIR Notes. You can turn them on again from your Relatune settings.", request.url, 200);
}

function page(message: string, requestUrl: string, status: number) {
  const home = new URL("/#pair-notes", requestUrl).toString();
  return new Response(`<!doctype html><html><body style="margin:0;background:#f7f0e7;color:#2f2530;font-family:Arial,sans-serif;display:grid;min-height:100vh;place-items:center"><main style="max-width:520px;background:#fffdf9;border-radius:24px;padding:38px;text-align:center"><h1 style="font-family:Georgia,serif;font-weight:500">Relatune</h1><p>${message}</p><a href="${home}" style="color:#5a334f;font-weight:700">Return to Relatune</a></main></body></html>`, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
