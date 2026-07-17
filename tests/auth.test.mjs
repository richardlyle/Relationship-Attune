import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function read(path) {
  return readFile(new URL(path, root), "utf8");
}

test("uses application-owned username and password authentication", async () => {
  const [auth, login, register, form, home] = await Promise.all([
    read("app/auth.ts"),
    read("app/api/auth/login/route.ts"),
    read("app/api/auth/register/route.ts"),
    read("app/login/AuthForm.tsx"),
    read("app/page.tsx"),
  ]);

  assert.match(auth, /PBKDF2/);
  assert.match(auth, /PASSWORD_ITERATIONS = 100_000/);
  assert.match(auth, /HttpOnly/);
  assert.match(auth, /SameSite=Lax/);
  assert.match(auth, /Secure/);
  assert.match(auth, /crypto\.getRandomValues/);
  assert.match(login, /MAX_FAILED_ATTEMPTS = 8/);
  assert.match(register, /validUsername/);
  assert.match(form, /Create account/);
  assert.match(form, /type="password"/);
  assert.match(home, /getCurrentUser/);
});

test("adds durable account and session tables", async () => {
  const [schema, migration] = await Promise.all([
    read("db/schema.ts"),
    read("drizzle/0001_local_accounts.sql"),
  ]);

  assert.match(schema, /sqliteTable\("accounts"/);
  assert.match(schema, /sqliteTable\("sessions"/);
  assert.match(migration, /CREATE TABLE `accounts`/);
  assert.match(migration, /CREATE TABLE `sessions`/);
  assert.match(migration, /accounts_username_unique/);
});

test("removes ChatGPT sign-in from application routes", async () => {
  const appEntries = await readdir(new URL("app/", root), { recursive: true });
  const sourceFiles = appEntries.filter((entry) => /\.(?:ts|tsx)$/.test(entry));
  const sources = await Promise.all(sourceFiles.map((entry) => read(`app/${entry.replaceAll("\\", "/")}`)));
  const combined = sources.join("\n");

  assert.doesNotMatch(combined, /signin-with-chatgpt|signout-with-chatgpt|oai-authenticated-user|getChatGPTUser/);
  assert.match(combined, /href="\/login"/);
  assert.match(combined, /action="\/api\/auth\/logout"/);
});

test("adds verified weekly PAIR Notes with unsubscribe and rotation history", async () => {
  const [schema, migration, settings, sender, card, scheduler] = await Promise.all([
    read("db/schema.ts"),
    read("drizzle/0002_relatune_pair_notes.sql"),
    read("app/api/pair-notes/settings/route.ts"),
    read("app/api/pair-notes/send/route.ts"),
    read("app/components/PairNotesCard.tsx"),
    read(".github/workflows/pair-notes.yml"),
  ]);

  assert.match(schema, /weeklyEmailEnabled/);
  assert.match(schema, /weekly_email_history/);
  assert.match(migration, /accounts_email_unique/);
  assert.match(migration, /weekly_email_history_recipient_week_idx/);
  assert.match(settings, /sendVerificationEmail/);
  assert.match(sender, /selectNextPairNote/);
  assert.match(sender, /unsubscribeToken/);
  assert.match(card, /PAIR Notes/);
  assert.match(card, /never shown to your partner/);
  assert.match(scheduler, /schedule:/);
  assert.match(scheduler, /PAIR_NOTES_CRON_SECRET/);
});

test("uses the Relatune brand in primary metadata and navigation", async () => {
  const [layout, app, login] = await Promise.all([
    read("app/layout.tsx"),
    read("app/components/RelationshipApp.tsx"),
    read("app/login/page.tsx"),
  ]);
  assert.match(layout, /Relatune/);
  assert.match(app, /Relatune/);
  assert.match(login, /Relatune/);
  assert.doesNotMatch(`${layout}\n${app}\n${login}`, /Between Us/);
});
