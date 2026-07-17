declare module "cloudflare:workers" {
  export const env: {
    DB: any;
    GMAIL_CLIENT_ID?: string;
    GMAIL_CLIENT_SECRET?: string;
    GMAIL_REFRESH_TOKEN?: string;
    GMAIL_SENDER_EMAIL?: string;
    PAIR_NOTES_CRON_SECRET?: string;
    PUBLIC_SITE_URL?: string;
  };
}

declare type Fetcher = {
  fetch(input: Request): Promise<Response>;
};

declare type D1Database = any;