import { env } from "cloudflare:workers";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export function emailDeliveryConfigured() {
  return Boolean(
    env.GMAIL_CLIENT_ID?.trim()
    && env.GMAIL_CLIENT_SECRET?.trim()
    && env.GMAIL_REFRESH_TOKEN?.trim()
    && env.GMAIL_SENDER_EMAIL?.trim(),
  );
}

export async function sendEmail(message: EmailMessage) {
  const clientId = env.GMAIL_CLIENT_ID?.trim();
  const clientSecret = env.GMAIL_CLIENT_SECRET?.trim();
  const refreshToken = env.GMAIL_REFRESH_TOKEN?.trim();
  const senderEmail = env.GMAIL_SENDER_EMAIL?.trim();
  if (!clientId || !clientSecret || !refreshToken || !senderEmail) {
    return { configured: false as const, id: null };
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const tokenPayload = await tokenResponse.json().catch(() => ({})) as {
    access_token?: string;
    error_description?: string;
  };
  if (!tokenResponse.ok || !tokenPayload.access_token) {
    throw new Error(tokenPayload.error_description ?? "Google could not authorize email delivery.");
  }

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      authorization: `Bearer ${tokenPayload.access_token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ raw: createRawMessage(message, senderEmail) }),
  });
  const payload = await response.json().catch(() => ({})) as {
    id?: string;
    error?: { message?: string };
  };
  if (!response.ok || !payload.id) {
    throw new Error(payload.error?.message ?? "Gmail did not accept the message.");
  }
  return { configured: true as const, id: payload.id };
}

function createRawMessage(message: EmailMessage, senderEmail: string) {
  const boundary = `relatune_${crypto.randomUUID()}`;
  const source = [
    `From: Relatune <${sanitizeHeader(senderEmail)}>`,
    `To: ${sanitizeHeader(message.to)}`,
    `Subject: =?UTF-8?B?${toBase64(message.subject)}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(toBase64(message.text)),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(toBase64(message.html)),
    `--${boundary}--`,
    "",
  ].join("\r\n");
  return toBase64(source).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function sanitizeHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function wrapBase64(value: string) {
  return value.match(/.{1,76}/g)?.join("\r\n") ?? "";
}

function toBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}