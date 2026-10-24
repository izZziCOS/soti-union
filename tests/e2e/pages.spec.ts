import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { dictionaries, localizePath, locales, routes } from "../../src/i18n";

const pages = Object.entries(routes) as [keyof typeof routes, string][];

for (const locale of locales) {
  const t = dictionaries[locale];

  test.describe(`${locale}`, () => {
    for (const [key, route] of pages) {
      const url = localizePath(route, locale);

      test(`${key} renders and passes accessibility checks`, async ({ page }) => {
        const response = await page.goto(url);
        expect(response?.status()).toBe(200);

        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(page).toHaveTitle(/SOTI Union/);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          new RegExp(`${url}$`),
        );
        await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(
          locales.length + 1,
        );

        const { violations } = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          // Third-party map iframe content is outside our control.
          .exclude("iframe")
          .analyze();
        const report = violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
        );
        expect(report).toEqual([]);
      });
    }

    test("home page shows the localized hero", async ({ page }) => {
      await page.goto(localizePath(routes.home, locale));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(t.home.hero.title);
      await expect(
        page.getByRole("main").getByRole("link", { name: t.common.getInTouch }).first(),
      ).toHaveAttribute("href", localizePath(routes.contact, locale));
    });
  });
}

test("navigation reaches every section", async ({ page, isMobile }) => {
  const t = dictionaries.en;
  await page.goto("/");

  for (const [label, route] of [
    [t.nav.about, routes.about],
    [t.nav.references, routes.references],
    [t.nav.career, routes.career],
    [t.nav.contact, routes.contact],
  ] as const) {
    if (isMobile) await page.getByRole("button", { name: t.nav.openMenu }).click();
    await page
      .getByRole("navigation", { name: t.nav.primary })
      .getByRole("link", { name: label, exact: true })
      .and(page.locator(":visible"))
      .click();
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    if (isMobile) await page.getByRole("button", { name: t.nav.openMenu }).click();
    await expect(page.locator('[aria-current="page"]:visible')).toHaveText(label);
    if (isMobile) await page.keyboard.press("Escape");
  }
});

test("language switcher keeps the current page", async ({ page, isMobile }) => {
  await page.goto("/career/");
  if (isMobile) await page.getByRole("button", { name: dictionaries.en.nav.openMenu }).click();
  await page.locator('a[hreflang="lt"]:visible').click();
  await expect(page).toHaveURL(/\/lt\/career\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "lt");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(dictionaries.lt.career.heading);
});

test("mobile menu opens, closes and is announced", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  const t = dictionaries.en;
  await page.goto("/");

  const toggle = page.getByRole("button", { name: t.nav.openMenu });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(page.locator("#mobile-nav")).toBeVisible();
  const close = page.getByRole("button", { name: t.nav.closeMenu });
  await expect(close).toHaveAttribute("aria-expanded", "true");

  await page.keyboard.press("Escape");
  await expect(page.locator("#mobile-nav")).toBeHidden();
  await expect(toggle).toBeFocused();
});

test("gallery lightbox opens, navigates and closes", async ({ page }) => {
  const t = dictionaries.en.references;
  const [first = "", second = "", third = ""] = t.gallery;
  await page.goto("/references/");

  await page.getByRole("button", { name: `${t.lightbox.open}: ${second}` }).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img", { name: second })).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByRole("img", { name: third })).toBeVisible();
  await dialog.getByRole("button", { name: t.lightbox.previous }).click();
  await dialog.getByRole("button", { name: t.lightbox.previous }).click();
  await expect(dialog.getByRole("img", { name: first })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
});

test("contact page exposes working contact links", async ({ page }) => {
  await page.goto("/contact/");
  const main = page.getByRole("main");
  await expect(main.locator('a[href="mailto:info@sotiunion.com"]')).toBeVisible();
  await expect(main.locator('a[href="mailto:marketing@sotiunion.com"]')).toBeVisible();
  await expect(main.locator('a[href="tel:+37068878021"]')).toBeVisible();
  await expect(main.locator('a[href="tel:+37068753334"]')).toBeVisible();
  await expect(main.locator("iframe")).toHaveAttribute("title", dictionaries.en.contact.mapTitle);
});

test("career page links to the CV email", async ({ page }) => {
  await page.goto("/ru/career/");
  await expect(
    page.getByRole("link", { name: dictionaries.ru.career.apply.button }),
  ).toHaveAttribute("href", /^mailto:info@sotiunion\.com\?subject=/);
});

test("AIDAprima story is linked from references", async ({ page }) => {
  await page.goto("/lt/references/");
  await page.getByRole("link", { name: dictionaries.lt.common.readStory }).click();
  await expect(page).toHaveURL(/\/lt\/references\/aidaprima\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    dictionaries.lt.aidaprima.heading,
  );
});

test("unknown pages return the 404 page", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    dictionaries.en.notFound.heading,
  );
});

test("sitemap lists every localized page", async ({ request }) => {
  const index = await request.get("/sitemap-index.xml");
  expect(index.ok()).toBe(true);
  const sitemap = await (await request.get("/sitemap-0.xml")).text();
  for (const locale of locales) {
    for (const route of Object.values(routes)) {
      expect(sitemap).toContain(`${localizePath(route, locale)}</loc>`);
    }
  }
});
