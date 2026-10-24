import { describe, expect, it } from "vitest";
import { icons } from "~/components/icons";
import { dictionaries, locales, type Dictionary } from "~/i18n";

/** Flattens a dictionary into `path → value` pairs, with array indices as path segments. */
function flatten(value: unknown, prefix = ""): [string, unknown][] {
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      flatten(child, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [[prefix, value]];
}

const en = dictionaries.en;
const others = locales.filter((l) => l !== "en");

describe("translations", () => {
  it.each(others)("%s has exactly the same keys as en", (locale) => {
    const keys = (d: Dictionary) => flatten(d).map(([key]) => key);
    expect(keys(dictionaries[locale])).toEqual(keys(en));
  });

  it.each(locales)("%s has no empty strings", (locale) => {
    const empty = flatten(dictionaries[locale]).filter(
      ([, value]) => typeof value === "string" && value.trim() === "",
    );
    expect(empty).toEqual([]);
  });

  it.each(others)("%s keeps locale-independent values identical to en", (locale) => {
    const d = dictionaries[locale];
    expect(d.references.items.map((i) => i.year)).toEqual(en.references.items.map((i) => i.year));
    expect(d.references.items.map((i) => i.story)).toEqual(en.references.items.map((i) => i.story));
    expect(d.home.services.items.map((i) => i.icon)).toEqual(
      en.home.services.items.map((i) => i.icon),
    );
    expect(d.home.markets.items.map((i) => i.key)).toEqual(en.home.markets.items.map((i) => i.key));
    expect(d.home.stats.map((s) => s.value)).toEqual(en.home.stats.map((s) => s.value));
    expect(d.contact.people.map((p) => p.key)).toEqual(en.contact.people.map((p) => p.key));
  });
});

describe("content invariants", () => {
  it("lists references newest first", () => {
    const startYears = en.references.items.map((i) => Number.parseInt(i.year, 10));
    expect(startYears).toEqual([...startYears].sort((a, b) => b - a));
  });

  it("links exactly one reference to the AIDAprima story", () => {
    expect(en.references.items.filter((i) => i.story)).toHaveLength(1);
  });

  it("has a caption for each of the six gallery images", () => {
    expect(en.references.gallery).toHaveLength(6);
  });

  it("uses only icons that exist", () => {
    for (const { icon } of en.home.services.items) {
      expect(Object.keys(icons)).toContain(icon);
    }
  });

  it("uses only market keys that have images", () => {
    expect(en.home.markets.items.map((m) => m.key).sort()).toEqual(
      ["oilgas", "shipbuilding", "steel", "wind"].sort(),
    );
  });
});
