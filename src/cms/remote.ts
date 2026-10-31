import { locales, type Locale } from "~/i18n/locales";
import { cms } from "./env";
import type { ContentValues } from "./editable";
import type { CmsImage } from "./media";

interface Remote {
  content: ContentValues;
  /** Details of the pictures chosen in the panel (description, focal point), by key. */
  media: Record<string, CmsImage>;
}

/**
 * The texts changed in the CMS panel, per language, loaded once per build.
 * Null when the build does not use the CMS (development, tests). A deploy build
 * fails if the CMS cannot be reached, rather than publishing outdated texts.
 */
const remote: Record<Locale, Remote> | null = cms.fetchContent ? await load() : null;

export const remoteContent: Record<Locale, ContentValues> | null = remote
  ? (Object.fromEntries(locales.map((l) => [l, remote[l].content])) as Record<
      Locale,
      ContentValues
    >)
  : null;

/** The pictures chosen in the CMS panel, per language (their descriptions are translated). */
export const remoteMedia: Record<Locale, Record<string, CmsImage>> | null = remote
  ? (Object.fromEntries(locales.map((l) => [l, remote[l].media])) as Record<
      Locale,
      Record<string, CmsImage>
    >)
  : null;

async function load(): Promise<Record<Locale, Remote>> {
  const entries = await Promise.all(
    locales.map(async (locale) => {
      const url = `${cms.url}/api/v1/${cms.site}/content?lang=${locale}`;
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) {
        throw new Error(`CMS content could not be loaded (${response.status}): ${url}`);
      }
      const body = (await response.json()) as {
        data: ContentValues;
        media?: Record<string, CmsImage> | unknown[];
      };
      // a CMS without the media library sends no `media`
      const media = body.media && !Array.isArray(body.media) ? body.media : {};
      return [locale, { content: body.data, media }] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<Locale, Remote>;
}
