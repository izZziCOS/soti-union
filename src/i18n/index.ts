import type { Locale } from "./locales";
import en, { type Dictionary } from "./translations/en";
import lt from "./translations/lt";
import ru from "./translations/ru";

export * from "./locales";
export type { Dictionary };

export const dictionaries: Record<Locale, Dictionary> = { en, lt, ru };

export function useTranslations(locale: Locale): Dictionary {
  return dictionaries[locale];
}
