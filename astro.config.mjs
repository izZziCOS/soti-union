// @ts-check
import { readFile, writeFile } from "node:fs/promises";
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";

// CMS_* settings may also come from a local .env file (see .env.example).
Object.assign(process.env, { ...loadEnv("", process.cwd(), "CMS_"), ...process.env });

/** Writes the Apache configuration (server/htaccess) to dist/.htaccess for IONOS hosting. */
function apacheConfig() {
  return {
    name: "apache-config",
    hooks: {
      /** @param {{ dir: URL }} options */
      "astro:build:done": async ({ dir }) => {
        const template = await readFile(new URL("./server/htaccess", import.meta.url), "utf8");
        const origin = process.env.CMS_URL ? ` ${new URL(process.env.CMS_URL).origin}` : "";
        await writeFile(new URL(".htaccess", dir), template.replaceAll(" %CMS_ORIGIN%", origin));
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
