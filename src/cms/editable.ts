/**
 * Which texts of the site can be changed in the CMS panel, and how the panel's
 * values are applied at build time.
 *
 * Every string in the translation dictionaries is editable under its dotted path
 * (e.g. `home.hero.title`, `home.stats.0.label`), and so are the company details
 * (`company.email`, …). Lists in `editableLists` are edited as a whole, so items can
 * be added and removed. Pictures in `editableImages` can be replaced by uploading
 * a photo; the site keeps its own until one is uploaded. The repository texts stay the defaults: the deploy sends
 * them to the CMS (`npm run content:sync`) and the CMS returns its changes.
 *
 * Imports use `.ts` extensions so the sync script can run this file in plain Node.
 */
import { defaultLocale, locales, type Locale } from "../i18n/locales.ts";

export type ListFieldKind = "text" | "textarea" | "lines";

/** Lists edited as a whole: path → item fields. `lines` fields are string arrays. */
export const editableLists = {
  "career.positions": { title: "text", requirements: "lines" },
} as const satisfies Record<string, Record<string, ListFieldKind>>;

/** Pictures replaceable in the panel. The CMS returns the uploaded photo's URL, or null. */
export const editableImages = ["home.hero.image"] as const;

export type EditableImage = (typeof editableImages)[number];

/** Strings that are code (icon names, image keys) or screen-reader-only control labels. */
const notEditable = [
  /\.icon$/,
  /\.key$/,
  /^nav\.(openMenu|closeMenu|language|skipToContent|primary)$/,
  /\.lightbox\./,
];

/** Texts that are the same in every language: edited once in the panel. */
const sameInEveryLanguage = [
  /^company\./,
  /^home\.stats\.\d+\.value$/,
  /^references\.items\.\d+\.year$/,
];

/** Company details (from `src/data/company-defaults.ts`) editable under `company.`. */
export const editableCompanyFields = [
  "legalName",
  "email",
  "marketingEmail",
  "phones.director",
  "phones.marketing",
  "phones.careers",
  "address.street",
  "address.postalCode",
  "address.city",
  "companyCode",
  "vatCode",
] as const;

/** Longer texts get a multi-line field in the panel. */
const TEXTAREA_FROM = 90;

type Translated = Partial<Record<Locale, string>>;
type ListItem = Record<string, Translated>;

export interface ManifestEntry {
  key: string;
  type: "text" | "textarea" | "list" | "image";
  translatable: boolean;
  fields?: Record<string, ListFieldKind>;
  default: Translated | ListItem[];
}

/** What the CMS returns for one language: texts, and lists as items of field → text. */
export type ContentValues = Record<string, string | Record<string, string | null>[] | null>;

type Tree = Record<string, unknown>;

/** The texts offered for editing, with the repository texts as defaults. */
export function buildManifest(
  dictionaries: Record<Locale, object>,
  company: object,
): ManifestEntry[] {
  const entries: ManifestEntry[] = [];
  const listKeys = Object.keys(editableLists);
  const leaves = Object.fromEntries(locales.map((l) => [l, new Map(flatten(dictionaries[l]))]));

  for (const [key] of flatten(dictionaries[defaultLocale])) {
    if (notEditable.some((re) => re.test(key)) || listKeys.some((l) => key.startsWith(`${l}.`))) {
      continue;
    }
    const translatable = !sameInEveryLanguage.some((re) => re.test(key));
    const values: Translated = {};
    for (const locale of translatable ? locales : [defaultLocale]) {
      const value = leaves[locale]!.get(key);
      if (typeof value === "string") values[locale] = value;
    }
    entries.push(textEntry(key, values, translatable));
  }

  for (const field of editableCompanyFields) {
    const value = get(company, field);
    if (typeof value === "string") {
      entries.push(textEntry(`company.${field}`, { [defaultLocale]: value }, false));
    }
  }

  for (const [key, fields] of Object.entries(editableLists)) {
    const items = get(dictionaries[defaultLocale], key);
    if (!Array.isArray(items)) throw new Error(`Editable list ${key} is not a list`);

    entries.push({
      key,
      type: "list",
      translatable: true,
      fields,
      default: items.map((_, index) =>
        Object.fromEntries(
          Object.entries(fields).map(([field, kind]) => [
            field,
            Object.fromEntries(
              locales.map((locale) => {
                const value = get(dictionaries[locale], `${key}.${index}.${field}`);
                return [
                  locale,
                  kind === "lines" && Array.isArray(value) ? value.join("\n") : value,
                ];
              }),
            ),
          ]),
        ),
      ),
    });
  }

  for (const key of editableImages) {
    entries.push({ key, type: "image", translatable: false, default: {} });
  }

  return entries;
}

/** The URL of a picture uploaded in the CMS panel, or null when the site uses its own. */
export function imageUrl(values: ContentValues | undefined, key: EditableImage): string | null {
  const value = values?.[key];
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/** A copy of the dictionary with the CMS texts of one language applied. */
export function applyContent<T extends object>(dictionary: T, values: ContentValues): T {
  const result = structuredClone(dictionary);

  for (const [key, value] of Object.entries(values)) {
    if (key.startsWith("company.") || value === null) continue;

    const fields = (editableLists as Record<string, Record<string, ListFieldKind>>)[key];
    if (fields) {
      if (Array.isArray(value))
        set(
          result,
          key,
          value.map((item) => toListItem(item, fields)),
        );
    } else if (
      typeof value === "string" &&
      value.trim() !== "" &&
      typeof get(result, key) === "string"
    ) {
      set(result, key, value);
    }
  }

  return result;
}

/** A copy of the company details with the CMS values applied. */
export function applyCompany<T extends object>(company: T, values: ContentValues): T {
  const result = structuredClone(company);

  for (const field of editableCompanyFields) {
    const value = values[`company.${field}`];
    if (
      typeof value === "string" &&
      value.trim() !== "" &&
      typeof get(result, field) === "string"
    ) {
      set(result, field, value.trim());
    }
  }

  return result;
}

function toListItem(item: Record<string, string | null>, fields: Record<string, ListFieldKind>) {
  return Object.fromEntries(
    Object.entries(fields).map(([field, kind]) => {
      const text = item[field] ?? "";
      return [
        field,
        kind === "lines"
          ? text
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
          : text.trim(),
      ];
    }),
  );
}

function textEntry(key: string, values: Translated, translatable: boolean): ManifestEntry {
  const long = Object.values(values).some((v) => (v?.length ?? 0) > TEXTAREA_FROM);
  return { key, type: long ? "textarea" : "text", translatable, default: values };
}

/** `path → value` pairs of all leaves, with array indices as path segments. */
export function flatten(value: unknown, prefix = ""): [string, unknown][] {
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      flatten(child, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [[prefix, value]];
}

function get(tree: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((node, part) => (node as Tree | undefined)?.[part], tree);
}

function set(tree: object, path: string, value: unknown): void {
  const parts = path.split(".");
  const last = parts.pop()!;
  const parent = parts.reduce<unknown>((node, part) => (node as Tree | undefined)?.[part], tree);
  if (parent !== null && typeof parent === "object") (parent as Tree)[last] = value;
}
