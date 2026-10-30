import { locales, type Locale } from "~/i18n/locales";
import { cms } from "./env";
import type { ContentValues } from "./editable";

/**
 * The texts changed in the CMS panel, per language, loaded once per build.
 * Null when the build does not use the CMS (development, tests). A deploy build
 * fails if the CMS cannot be reached, rather than publishing outdated texts.
 */
export const remoteContent: Record<Locale, ContentValues> | null = cms.fetchContent
  ? await load()
  : null;

async function load(): Promise<Record<Locale, ContentValues>> {
  const entries = await Promise.all(
    locales.map(async (locale) => {
      const url = `${cms.url}/api/v1/${cms.site}/content?lang=${locale}`;
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) {
        throw new Error(`CMS content could not be loaded (${response.status}): ${url}`);
      }
      const body = (await response.json()) as { data: ContentValues };
      return [locale, body.data] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<Locale, ContentValues>;
}
