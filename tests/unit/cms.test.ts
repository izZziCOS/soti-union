import { describe, expect, it } from "vitest";
import {
  applyCompany,
  applyContent,
  buildManifest,
  editableCompanyFields,
  editableLists,
  imageUrl,
  type ContentValues,
} from "~/cms/editable";
import { companyDefaults } from "~/data/company-defaults";
import { baseDictionaries, locales, type Locale } from "~/i18n";

const manifest = buildManifest(baseDictionaries, companyDefaults);
const entry = (key: string) => manifest.find((e) => e.key === key);

/** What the CMS returns for a language when nothing was changed in the panel. */
function cmsValues(locale: Locale): ContentValues {
  return Object.fromEntries(
    manifest.map((e) => {
      if (e.type === "list") {
        const items = e.default as Record<string, Partial<Record<Locale, string>>>[];
        return [
          e.key,
          items.map((item) =>
            Object.fromEntries(Object.entries(item).map(([f, v]) => [f, v[locale] ?? null])),
          ),
        ];
      }
      const values = e.default as Partial<Record<Locale, string>>;
      return [e.key, values[locale] ?? values.en ?? null];
    }),
  );
}

describe("editable texts sent to the CMS", () => {
  it("have unique keys the CMS accepts", () => {
    const keys = manifest.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key).toMatch(/^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*$/);
  });

  it("include every text in all languages", () => {
    const text = entry("home.hero.title")!;
    expect(text.translatable).toBe(true);
    expect(Object.keys(text.default)).toEqual([...locales]);
    expect(entry("about.paragraphs.0")?.type).toBe("textarea");
  });

  it("include company details once for all languages", () => {
    for (const field of editableCompanyFields) {
      const e = entry(`company.${field}`)!;
      expect(e.translatable).toBe(false);
      expect(Object.keys(e.default)).toEqual(["en"]);
    }
    expect(entry("home.stats.0.value")?.translatable).toBe(false);
  });

  it("leave out code values and screen-reader labels", () => {
    expect(entry("home.services.items.0.icon")).toBeUndefined();
    expect(entry("home.markets.items.0.key")).toBeUndefined();
    expect(entry("nav.openMenu")).toBeUndefined();
    expect(entry("references.lightbox.close")).toBeUndefined();
  });

  it("send open positions as one list with requirements as lines", () => {
    const positions = entry("career.positions")!;
    expect(positions.type).toBe("list");
    expect(positions.fields).toEqual(editableLists["career.positions"]);
    expect(manifest.some((e) => e.key.startsWith("career.positions."))).toBe(false);

    const [first] = positions.default as Record<string, Record<string, string>>[];
    expect(first!["title"]!["lt"]).toBe(baseDictionaries.lt.career.positions[0]!.title);
    expect(first!["requirements"]!["en"]).toBe(
      baseDictionaries.en.career.positions[0]!.requirements.join("\n"),
    );
  });
});

describe("applying the CMS texts", () => {
  it.each(locales)("gives back the repository texts when nothing changed (%s)", (locale) => {
    expect(applyContent(baseDictionaries[locale], cmsValues(locale))).toEqual(
      baseDictionaries[locale],
    );
    expect(applyCompany(companyDefaults, cmsValues(locale))).toEqual(companyDefaults);
  });

  it("replaces changed texts and lists", () => {
    const result = applyContent(baseDictionaries.en, {
      "home.hero.title": "New title",
      "home.stats.1.label": "Workers",
      "career.positions": [{ title: " Fitters ", requirements: "Experience\n\n Certificate " }],
    });

    expect(result.home.hero.title).toBe("New title");
    expect(result.home.stats[1]!.label).toBe("Workers");
    expect(result.career.positions).toEqual([
      { title: "Fitters", requirements: ["Experience", "Certificate"] },
    ]);
    expect(baseDictionaries.en.home.hero.title).not.toBe("New title");
  });

  it("allows an empty list of positions", () => {
    expect(applyContent(baseDictionaries.en, { "career.positions": [] }).career.positions).toEqual(
      [],
    );
  });

  it("ignores empty values, unknown keys and values of the wrong kind", () => {
    const result = applyContent(baseDictionaries.en, {
      "home.hero.title": "  ",
      "home.unknown": "x",
      "home.stats": "not a list",
      "career.positions": "not a list",
    });
    expect(result).toEqual(baseDictionaries.en);
  });

  it("applies changed company details", () => {
    const result = applyCompany(companyDefaults, {
      "company.phones.director": "+370 600 00000",
      "company.name": "Not editable",
    });
    expect(result.phones.director).toBe("+370 600 00000");
    expect(result.name).toBe(companyDefaults.name);
  });
});

describe("pictures replaceable in the CMS", () => {
  it("offers the home page photo, with no default (the site keeps its own)", () => {
    expect(entry("home.hero.image")).toEqual({
      key: "home.hero.image",
      type: "image",
      translatable: false,
      default: {},
    });
  });

  it("uses the uploaded photo only when the CMS returns one", () => {
    expect(
      imageUrl({ "home.hero.image": "https://cms.test/media/content/a.jpg" }, "home.hero.image"),
    ).toBe("https://cms.test/media/content/a.jpg");
    expect(imageUrl({ "home.hero.image": null }, "home.hero.image")).toBeNull();
    expect(imageUrl(undefined, "home.hero.image")).toBeNull();
  });
});
