declare module "cloudflare:workers" {
  export const env: { DB: any };
}

declare type Fetcher = {
  fetch(input: Request): Promise<Response>;
};

declare type D1Database = any;
