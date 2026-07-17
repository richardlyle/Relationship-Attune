import vinext from "vinext";
import { defineConfig } from "vite";
import { sites } from "./build/sites-vite-plugin.ts";

const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";


export default defineConfig(async () => {
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  const isLocalPreview = process.env.CODEX_LOCAL_PREVIEW === "1";
  const cloudflarePlugin = isLocalPreview ? null : (await import("@cloudflare/vite-plugin")).cloudflare({
    viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
  });

  return {
    resolve: isLocalPreview ? { alias: { "cloudflare:workers": `${process.cwd()}/work/cloudflare-workers-stub.ts` } } : undefined,
    server: isCodexSeatbeltSandbox ? { watch: { useFsEvents: false, usePolling: true } } : undefined,
    plugins: [vinext(), sites(), ...(cloudflarePlugin ? [cloudflarePlugin] : [])],
  };
});
