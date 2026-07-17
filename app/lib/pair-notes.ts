import { env } from "cloudflare:workers";
import { sendEmail } from "./email-delivery";

export type PairNoteSource = {
  quizSlug: string;
  primaryType: string;
  quizTitle: string;
  profileTitle: string;
  summary: string;
  care: string[];
};

export type PairNoteCandidate = {
  tipKey: string;
  tipText: string;
  quizTitle: string;
  profileTitle: string;
  summary: string;
};

export const supportedTimezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
] as const;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validTimezone(value: string) {
  return supportedTimezones.includes(value as (typeof supportedTimezones)[number]);
}

export function selectNextPairNote(
  results: PairNoteSource[],
  history: Array<{ tipKey: string; sentAt: string | null }>,
): PairNoteCandidate | null {
  const candidates = results.flatMap((result) => result.care.map((tipText, index) => ({
    tipKey: `${result.quizSlug}:${result.primaryType}:${index}`,
    tipText,
    quizTitle: result.quizTitle,
    profileTitle: result.profileTitle,
    summary: result.summary,
  })));
  if (!candidates.length) return null;

  const lastSent = new Map<string, number>();
  for (const item of history) {
    const timestamp = item.sentAt ? Date.parse(item.sentAt) : 0;
    lastSent.set(item.tipKey, Math.max(lastSent.get(item.tipKey) ?? 0, timestamp));
  }
  return candidates.find((candidate) => !lastSent.has(candidate.tipKey))
    ?? [...candidates].sort((left, right) => (lastSent.get(left.tipKey) ?? 0) - (lastSent.get(right.tipKey) ?? 0))[0];
}

export function mondayWeekKey(date = new Date()) {
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const daysSinceMonday = (monday.getUTCDay() + 6) % 7;
  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);
  return monday.toISOString().slice(0, 10);
}

export function verificationExpiresAt() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

export function publicOrigin(requestUrl: string) {
  const configured = env.PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Fall back to the current request origin.
    }
  }
  return new URL(requestUrl).origin;
}

export async function sendVerificationEmail(to: string, token: string, origin: string) {
  const verifyUrl = `${origin}/api/pair-notes/verify?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to,
    subject: "Confirm your Relatune PAIR Notes",
    html: emailShell(`
      <p style="margin:0 0 12px;color:#b65b68;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">PAIR Notes</p>
      <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:34px;font-weight:500;color:#2f2530">A little more care, once a week.</h1>
      <p style="margin:0 0 24px;color:#72676f;line-height:1.65">Confirm this email to receive one practical Monday idea based on your partner's saved personality results.</p>
      <p style="margin:0"><a href="${verifyUrl}" style="display:inline-block;border-radius:999px;background:#5a334f;color:#fff;padding:14px 22px;text-decoration:none;font-weight:700">Confirm my email</a></p>
      <p style="margin:24px 0 0;color:#8b7f87;font-size:12px;line-height:1.55">This link expires in 24 hours. If you did not request it, you can ignore this message.</p>
    `),
    text: `Confirm your Relatune PAIR Notes email: ${verifyUrl}\n\nThis link expires in 24 hours.`,
  });
}

export async function sendWeeklyPairNote(input: {
  to: string;
  recipientName: string;
  partnerName: string;
  note: PairNoteCandidate;
  origin: string;
  unsubscribeToken: string;
}) {
  const unsubscribeUrl = `${input.origin}/api/pair-notes/unsubscribe?token=${encodeURIComponent(input.unsubscribeToken)}`;
  const subject = `One small way to care for ${input.partnerName} this week`;
  const partnerName = escapeHtml(input.partnerName);
  const tip = escapeHtml(input.note.tipText);
  const summary = escapeHtml(input.note.summary);
  const source = escapeHtml(`${input.note.quizTitle}: ${input.note.profileTitle}`);
  return sendEmail({
    to: input.to,
    subject,
    html: emailShell(`
      <p style="margin:0 0 12px;color:#b65b68;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">This week's PAIR Note</p>
      <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:34px;font-weight:500;color:#2f2530">One small way to care for ${partnerName}</h1>
      <div style="margin:24px 0;border-left:3px solid #b65b68;border-radius:0 16px 16px 0;background:#f7f0e7;padding:20px 22px;color:#2f2530;font-size:18px;line-height:1.55">${tip}</div>
      <p style="margin:0 0 8px;color:#5a334f;font-weight:700">Why this may help</p>
      <p style="margin:0 0 18px;color:#72676f;line-height:1.65">${summary}</p>
      <p style="margin:0;color:#8b7f87;font-size:12px">Based on ${source}</p>
      <p style="margin:28px 0 0"><a href="${input.origin}/#care-map" style="color:#5a334f;font-weight:700">Open your Relatune care maps</a></p>
      <p style="margin:26px 0 0;color:#9a8f96;font-size:11px;line-height:1.5">You opted in to weekly PAIR Notes. <a href="${unsubscribeUrl}" style="color:#72676f">Unsubscribe</a></p>
    `),
    text: `${subject}\n\n${input.note.tipText}\n\nWhy this may help: ${input.note.summary}\n\nBased on ${input.note.quizTitle}: ${input.note.profileTitle}\n\nUnsubscribe: ${unsubscribeUrl}`,
  });
}

function emailShell(content: string) {
  return `<!doctype html><html><body style="margin:0;background:#f7f0e7;padding:28px 14px;font-family:Arial,sans-serif"><main style="max-width:600px;margin:0 auto;border-radius:22px;background:#fffdf9;padding:34px">${content}<p style="margin:32px 0 0;border-top:1px solid rgba(68,48,62,.14);padding-top:20px;color:#5a334f;font-family:Georgia,serif;font-size:18px">Relatune</p></main></body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}
