import { applyContent } from "~/cms/editable";
import { remoteContent } from "~/cms/remote";
import { locales, type Locale } from "./locales";
import en, { type Dictionary } from "./translations/en";
import lt from "./translations/lt";
import ru from "./translations/ru";

export * from "./locales";
export type { Dictionary };

/** The texts as written in the repository (the CMS defaults). */
export const baseDictionaries: Record<Locale, Dictionary> = { en, lt, ru };

/** The texts as published: repository texts with the changes made in the CMS. */
export const dictionaries: Record<Locale, Dictionary> = Object.fromEntries(
  locales.map((locale) => [
    locale,
    remoteContent
      ? applyContent(baseDictionaries[locale], remoteContent[locale])
      : baseDictionaries[locale],
  ]),
) as Record<Locale, Dictionary>;

export function useTranslations(locale: Locale): Dictionary {
  return dictionaries[locale];
}
