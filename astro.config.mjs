// @ts-check
import { readFile, writeFile } from "node:fs/promises";
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";

// CMS_* settings may also come from a local .env file (see .env.example).
Object.assign(process.env, { ...loadEnv("", process.cwd(), "CMS_"), ...process.env });

/**
 * Writes the Apache configuration (server/htaccess) to dist/.htaccess for IONOS hosting,
 * and the page link preview crawlers get for news posts (server/news-og.php).
 */
function apacheConfig() {
  /** @type {{ site: string, base: string }} */
  const target = { site: "", base: "/" };

  return {
    name: "apache-config",
    hooks: {
      /** @param {{ config: import("astro").AstroConfig }} options */
      "astro:config:done": ({ config }) => {
        target.site = config.site ?? "";
        target.base = config.base;
      },
      /** @param {{ dir: URL }} options */
      "astro:build:done": async ({ dir }) => {
        const template = await readFile(new URL("./server/htaccess", import.meta.url), "utf8");
        const origin = process.env.CMS_URL ? ` ${new URL(process.env.CMS_URL).origin}` : "";
        await writeFile(new URL(".htaccess", dir), template.replaceAll(" %CMS_ORIGIN%", origin));

        const cmsUrl = (process.env.CMS_URL ?? "").replace(/\/+$/, "");
        const og = await readFile(new URL("./server/news-og.php", import.meta.url), "utf8");
        /** @type {Record<string, string>} PHP strings in single quotes: URLs and keys, no quotes */
        const values = {
          CMS_API: cmsUrl ? `${cmsUrl}/api/v1/${process.env.CMS_SITE ?? "soti"}` : "",
          SITE_URL: new URL(target.base, target.site).href.replace(/\/+$/, ""),
          DEFAULT_LOCALE: "en",
        };
        for (const value of Object.values(values)) {
          if (/['\\]/.test(value)) throw new Error(`Unexpected character in ${value}`);
        }
        await writeFile(
          new URL("news-og.php", dir),
          og.replace(/%(CMS_API|SITE_URL|DEFAULT_LOCALE)%/g, (_, key) => values[key] ?? ""),
        );
      },
    },
  };
}

export default defineConfig({
  site: process.env.SITE_URL || "https://sotiunion.com",
  // Sub-path deployments such as `/soti-union`.
  base: process.env.BASE_PATH || "/",
  trailingSlash: "ignore",
  build: {
    format: "directory",
  },
  image: {
    // Photos uploaded in the CMS are downloaded and optimized at build time.
    domains: process.env.CMS_URL ? [new URL(process.env.CMS_URL).hostname] : [],
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/404"),
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", lt: "lt", ru: "ru" },
      },
    }),
    apacheConfig(),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Keep every script external so the server can send a strict CSP without 'unsafe-inline'.
      assetsInlineLimit: 0,
    },
  },
});
