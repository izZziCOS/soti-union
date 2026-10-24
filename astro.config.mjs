// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: process.env.SITE_URL || "https://sotiunion.com",
  // Sub-path deployments such as GitHub Pages project sites (`/soti-union`).
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
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Keep every script external so nginx can serve a strict CSP without 'unsafe-inline'.
      assetsInlineLimit: 0,
    },
  },
});
