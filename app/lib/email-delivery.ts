import { env } from "cloudflare:workers";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export function emailDeliveryConfigured() {
  return Boolean(env.RESEND_API_KEY?.trim() && env.PAIR_NOTES_FROM?.trim());
}

export async function sendEmail(message: EmailMessage) {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.PAIR_NOTES_FROM?.trim();
  if (!apiKey || !from) {
    return { configured: false as const, id: null };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });

  const payload = await response.json().catch(() => ({})) as { id?: string; message?: string };
  if (!response.ok || !payload.id) {
    throw new Error(payload.message ?? "The email provider did not accept the message.");
  }
  return { configured: true as const, id: payload.id };
}
