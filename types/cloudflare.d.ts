declare module "cloudflare:workers" {
  export const env: {
    DB: any;
    RESEND_API_KEY?: string;
    PAIR_NOTES_FROM?: string;
    PAIR_NOTES_CRON_SECRET?: string;
    PUBLIC_SITE_URL?: string;
  };
}

declare type Fetcher = {
  fetch(input: Request): Promise<Response>;
};

declare type D1Database = any;
