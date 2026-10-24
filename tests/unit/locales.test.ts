import { describe, expect, it } from "vitest";
import {
  defaultLocale,
  isLocale,
  localeStaticPaths,
  localizePath,
  locales,
  parsePathname,
  resolveLocale,
  routes,
  telHref,
} from "~/i18n/locales";

describe("isLocale / resolveLocale", () => {
  it("accepts supported locales only", () => {
    expect(isLocale("lt")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("falls back to the default locale", () => {
    expect(resolveLocale(undefined)).toBe("en");
    expect(resolveLocale("ru")).toBe("ru");
    expect(resolveLocale("xx")).toBe(defaultLocale);
  });
});

describe("localizePath", () => {
  it("leaves default-locale paths unprefixed", () => {
    expect(localizePath("/", "en")).toBe("/");
    expect(localizePath("/about/", "en")).toBe("/about/");
  });

  it("prefixes other locales", () => {
    expect(localizePath("/", "lt")).toBe("/lt/");
    expect(localizePath("/references/aidaprima/", "ru")).toBe("/ru/references/aidaprima/");
  });

  it("normalizes missing slashes", () => {
    expect(localizePath("about", "lt")).toBe("/lt/about/");
    expect(localizePath("/career", "en")).toBe("/career/");
  });
});

describe("parsePathname", () => {
  it.each([
    ["/", "en", "/"],
    ["/about/", "en", "/about/"],
    ["/about", "en", "/about/"],
    ["/lt/", "lt", "/"],
    ["/ru", "ru", "/"],
    ["/lt/references/aidaprima/", "lt", "/references/aidaprima/"],
  ])("%s → %s %s", (pathname, locale, path) => {
    expect(parsePathname(pathname)).toEqual({ locale, path });
  });

  it("round-trips every route in every locale", () => {
    for (const locale of locales) {
      for (const route of Object.values(routes)) {
        expect(parsePathname(localizePath(route, locale))).toEqual({ locale, path: route });
      }
    }
  });
});

describe("localeStaticPaths", () => {
  it("generates one entry per locale with no prefix for the default", () => {
    expect(localeStaticPaths()).toEqual([
      { params: { lang: undefined } },
      { params: { lang: "lt" } },
      { params: { lang: "ru" } },
    ]);
  });
});

describe("telHref", () => {
  it("strips formatting from phone numbers", () => {
    expect(telHref("+370 688 78021")).toBe("tel:+37068878021");
    expect(telHref("(8) 640-52074")).toBe("tel:864052074");
  });
});
