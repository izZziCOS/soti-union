import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { dictionaries, localizePath, routes } from "../../src/i18n";

// The news comes from the CMS in the browser; the CMS is mocked here. Needs a build with
// CMS_URL set (CI uses https://cms.test) and the same CMS_URL when running the tests.
const cmsUrl = process.env["CMS_URL"];
test.skip(!cmsUrl, "requires a build and test run with CMS_URL");

const api = `${cmsUrl}/api/v1/soti`;
const t = dictionaries.en.news;

const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

const posts = [
  {
    slug: "new-crane",
    title: "New crane in the workshop",
    excerpt: "A 20-tonne crane now serves the whole hall.",
    published_at: "2026-10-01T09:00:00+00:00",
    cover: { url: `${cmsUrl}/media/crane.jpg`, thumb_url: `${cmsUrl}/media/crane-thumb.webp` },
  },
  {
    slug: "iso-audit",
    title: "ISO audit passed",
    excerpt: null,
    published_at: "2026-09-01T09:00:00+00:00",
    cover: null,
  },
];

async function mockCms(page: Page, list = posts, status = 200) {
  await page.route(`${cmsUrl}/media/**`, (route) =>
    route.fulfill({ contentType: "image/png", body: PIXEL }),
  );
  await page.route(new RegExp(`^${api}/news\\?`), (route) =>
    route.fulfill({
      status,
      json: { data: list, meta: { current_page: 1, last_page: 1 } },
    }),
  );
  await page.route(new RegExp(`^${api}/news/new-crane\\?`), (route) =>
    route.fulfill({
      json: {
        data: {
          ...posts[0],
          body: "<p>The crane was <strong>installed</strong> in October.</p>",
          images: [
            {
              url: `${cmsUrl}/media/hall.jpg`,
              thumb_url: `${cmsUrl}/media/hall-thumb.webp`,
              caption: "The hall",
            },
          ],
          documents: [
            { url: `${cmsUrl}/media/specs.pdf`, name: "Crane specification", size: 245760 },
          ],
        },
      },
    }),
  );
  await page.route(new RegExp(`^${api}/news/missing\\?`), (route) =>
    route.fulfill({ status: 404, json: { message: "Not found" } }),
  );
}

test("news page lists the posts", async ({ page }) => {
  await mockCms(page);
  await page.goto(localizePath(routes.news, "en"));

  const cards = page.locator("[data-news-list] > li");
  await expect(cards).toHaveCount(2);
  await expect(cards.first().getByRole("heading")).toHaveText(posts[0]!.title);
  await expect(cards.first().locator("time")).toHaveAttribute("datetime", posts[0]!.published_at);
  await expect(cards.first().getByRole("link")).toHaveAttribute(
    "href",
    `${localizePath(routes.news, "en")}?post=new-crane`,
  );
  await expect(page.locator("[data-news-more]")).toBeHidden();

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});

test("a post shows its text, pictures and documents", async ({ page }) => {
  await mockCms(page);
  await page.goto(`${localizePath(routes.news, "lt")}?post=new-crane`);

  const article = page.locator("article");
  await expect(article.getByRole("heading", { level: 2 })).toHaveText(posts[0]!.title);
  await expect(article.locator("strong")).toHaveText("installed");
  await expect(article.getByRole("img", { name: "The hall" })).toBeVisible();
  await expect(article.getByRole("link", { name: /Crane specification/ })).toHaveAttribute(
    "href",
    `${cmsUrl}/media/specs.pdf`,
  );
  await expect(article.getByRole("link", { name: dictionaries.lt.news.back })).toHaveAttribute(
    "href",
    localizePath(routes.news, "lt"),
  );
  await expect(page).toHaveTitle(new RegExp(`^${posts[0]!.title}`));
});

test("a missing post and an unreachable CMS show a message", async ({ page }) => {
  await mockCms(page);
  await page.goto(`${localizePath(routes.news, "en")}?post=missing`);
  await expect(page.getByRole("status")).toHaveText(t.notFound);

  await page.unrouteAll();
  await mockCms(page, posts, 500);
  await page.goto(localizePath(routes.news, "en"));
  await expect(page.getByRole("status")).toHaveText(t.error);
});

test("an empty news list says so", async ({ page }) => {
  await mockCms(page, []);
  await page.goto(localizePath(routes.news, "en"));
  await expect(page.getByRole("status")).toHaveText(t.empty);
});

test("home page shows the latest news only when there is some", async ({ page }) => {
  await mockCms(page);
  await page.goto(localizePath(routes.home, "en"));
  const section = page.locator("[data-news-section]");
  await expect(section).toBeVisible();
  await expect(section.locator("[data-news-list] > li")).toHaveCount(2);

  await page.unrouteAll();
  await mockCms(page, []);
  await page.goto(localizePath(routes.home, "en"));
  await expect(page.locator("[data-news-list] > li")).toHaveCount(0);
  await expect(section).toBeHidden();
});
