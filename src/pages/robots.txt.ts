import type { APIRoute } from "astro";
import { cms } from "~/cms/env";
import { withBase } from "~/i18n";

// The news is served by the CMS, so its sitemap is on the CMS host.
export const GET: APIRoute = ({ site }) => {
  const sitemaps = [new URL(withBase("/sitemap-index.xml"), site).href];
  if (cms.url) sitemaps.push(`${cms.url}/api/v1/${cms.site}/news/sitemap.xml`);

  return new Response(
    `User-agent: *\nAllow: /\n\n${sitemaps.map((url) => `Sitemap: ${url}\n`).join("")}`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
};
