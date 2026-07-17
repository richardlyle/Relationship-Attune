# Relatune

Relatune is a private couples personality quiz site. Each person can create a username and password, complete educational personality quizzes, connect with a partner using a six-character code, and receive practical PAIR Notes based on their partner's saved results.

## Live site

https://relatune.org

## Account security

- Passwords are never stored in readable form.
- Password records use PBKDF2-HMAC-SHA256 with a unique salt and 100,000 iterations, the current Cloudflare Workers limit. The work factor is stored per account for future upgrades.
- Login sessions use random tokens in HttpOnly, SameSite cookies; only token hashes are stored in the database.
- Repeated failed logins temporarily lock the account.
- The public site envelope allows visitors to reach the login page without a ChatGPT account. Saved data remains available only after application login.

## Data storage

The `relatune-db` Cloudflare D1 database stores accounts, protected password records, sessions, couple connections, profiles, quiz results, email preferences, and PAIR Note history. GitHub stores source code only and does not contain visitor passwords or quiz data.

## Weekly PAIR Notes

Weekly email delivery uses Resend and an authenticated scheduled request. Configure these hosted values before enabling real delivery:

- `RESEND_API_KEY`
- `PAIR_NOTES_FROM` using a sender on a verified domain
- `PAIR_NOTES_CRON_SECRET`
- `PUBLIC_SITE_URL`

Add the same `PAIR_NOTES_CRON_SECRET` as a GitHub Actions repository secret. The included workflow checks every hour on Monday and sends only when each recipient reaches 8:00 AM in their selected time zone. Email addresses, verification state, opt-in state, and non-repeating tip history are stored in D1.

## Development

```bash
pnpm install
pnpm dev
```

Create a production build with:

```bash
pnpm build
```

Generate a migration after changing `db/schema.ts` with:

```bash
pnpm db:generate
```

Cloudflare deployment settings and the production D1 binding are declared in `wrangler.jsonc`. The older `.openai/hosting.json` file remains only so the previous Sites deployment can stay online during the migration.

## Important note

These quizzes are original educational reflections inspired by familiar personality frameworks. They are not diagnostic tools and are not affiliated with official assessment publishers.
