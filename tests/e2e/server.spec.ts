import { expect, test } from "@playwright/test";

// These checks cover the nginx configuration and only run against the Docker image
// (or a deployment), i.e. when BASE_URL is set.
test.skip(!process.env.BASE_URL, "requires BASE_URL pointing at the nginx container");

test("health endpoint responds", async ({ request }) => {
  const response = await request.get("/healthz");
  expect(response.status()).toBe(200);
});

test("security headers are set", async ({ request }) => {
  const headers = (await request.get("/")).headers();
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["server"]).not.toMatch(/\d/);
});

test("hashed assets are cached immutably", async ({ page, request }) => {
  await page.goto("/");
  const css = await page.locator('link[rel="stylesheet"]').first().getAttribute("href");
  expect(css).toMatch(/^\/_astro\//);
  const headers = (await request.get(css!)).headers();
  expect(headers["cache-control"]).toContain("immutable");
});

test.describe("legacy URLs from the old site redirect permanently", () => {
  for (const [from, to] of [
    ["/index.html", "/"],
    ["/about.html", "/about/"],
    ["/references.html", "/references/"],
    ["/news.html", "/references/aidaprima/"],
    ["/career.html", "/career/"],
    ["/contact.html", "/contact/"],
    ["/lt/about.html", "/lt/about/"],
    ["/ru/contact.html", "/ru/contact/"],
    ["/lt/index.html", "/lt/"],
    ["/about", "/about/"],
  ] as const) {
    test(`${from} → ${to}`, async ({ request }) => {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status()).toBe(301);
      expect(new URL(response.headers()["location"]!, "http://x").pathname).toBe(to);
    });
  }
});
