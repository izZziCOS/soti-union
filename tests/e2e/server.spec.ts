import { expect, test } from "@playwright/test";

// These checks cover the Apache configuration (server/htaccess) and only run against
// Apache (the CI job or the live site), i.e. when BASE_URL is set.
test.skip(!process.env["BASE_URL"], "requires BASE_URL pointing at Apache");

test("security headers are set", async ({ request }) => {
  const headers = (await request.get("/")).headers();
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-frame-options"]).toBe("DENY");
});

test("the CMS may be called for news", async ({ request }) => {
  test.skip(!process.env["CMS_URL"], "requires a build with CMS_URL");
  const csp = (await request.get("/")).headers()["content-security-policy"];
  const origin = new URL(process.env["CMS_URL"]!).origin;
  expect(csp).toContain(`connect-src 'self' ${origin}`);
  expect(csp).toContain(`img-src 'self' data: ${origin}`);
});

test("hashed assets are cached immutably, pages are revalidated", async ({ page, request }) => {
  const response = await page.goto("/");
  expect(response?.headers()["cache-control"]).toBe("no-cache");
  const css = await page.locator('link[rel="stylesheet"]').first().getAttribute("href");
  expect(css).toMatch(/^\/_astro\//);
  const headers = (await request.get(css!)).headers();
  expect(headers["cache-control"]).toContain("immutable");
});

test("unknown pages get the 404 page", async ({ request }) => {
  const response = await request.get("/no-such-page/");
  expect(response.status()).toBe(404);
  expect(await response.text()).toContain("<h1");
});

test.describe("legacy URLs from the old site redirect permanently", () => {
  for (const [from, to] of [
    ["/index.html", "/"],
    ["/about.html", "/about/"],
    ["/references.html", "/references/"],
    ["/news.html", "/news/"],
    ["/career.html", "/career/"],
    ["/contact.html", "/contact/"],
    ["/lt/about.html", "/lt/about/"],
    ["/ru/contact.html", "/ru/contact/"],
    ["/lt/index.html", "/lt/"],
    ["/lt/news.html", "/lt/news/"],
    ["/about", "/about/"],
  ] as const) {
    test(`${from} → ${to}`, async ({ request }) => {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status()).toBe(301);
      expect(new URL(response.headers()["location"]!, "http://x").pathname).toBe(to);
    });
  }
});
