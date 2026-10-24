export const locales = ["en", "lt", "ru"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, { name: string; short: string; og: string }> = {
  en: { name: "English", short: "EN", og: "en_US" },
  lt: { name: "Lietuvių", short: "LT", og: "lt_LT" },
  ru: { name: "Русский", short: "RU", og: "ru_RU" },
};

/** Locale-independent route paths. Always start and end with a slash. */
export const routes = {
  home: "/",
  about: "/about/",
  references: "/references/",
  aidaprima: "/references/aidaprima/",
  career: "/career/",
  contact: "/contact/",
} as const;
export type RouteKey = keyof typeof routes;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** Resolves the `[...lang]` route param (undefined for the default locale) to a locale. */
export function resolveLocale(param: string | undefined): Locale {
  return isLocale(param) ? param : defaultLocale;
}

function ensureTrailingSlash(path: string): string {
  return path.endsWith("/") ? path : `${path}/`;
}

/** Prefixes a locale-independent path with the locale segment (none for the default locale). */
export function localizePath(path: string, locale: Locale): string {
  const normalized = ensureTrailingSlash(path.startsWith("/") ? path : `/${path}`);
  return locale === defaultLocale ? normalized : `/${locale}${normalized}`;
}

/** Splits a pathname into its locale and the locale-independent remainder. */
export function parsePathname(pathname: string): { locale: Locale; path: string } {
  const [, first, ...rest] = pathname.split("/");
  if (isLocale(first) && first !== defaultLocale) {
    return { locale: first, path: ensureTrailingSlash(`/${rest.join("/")}`) };
  }
  return { locale: defaultLocale, path: ensureTrailingSlash(pathname || "/") };
}

/** Static paths for pages under `src/pages/[...lang]/`. */
export function localeStaticPaths() {
  return locales.map((locale) => ({
    params: { lang: locale === defaultLocale ? undefined : locale },
  }));
}

/** Turns a display phone number into a `tel:` href. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
