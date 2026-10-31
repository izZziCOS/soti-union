/**
 * Reports each page view to the CMS statistics (POST /api/v1/{site}/visits), see
 * BaseLayout.astro. No cookies; the CMS stores a shortened IP address only.
 */

/**
 * The page as counted: the path, plus the news post shown (?post=slug). Other query
 * parameters (ad campaign tags and the like) are left out.
 */
export function visitPath(url: URL): string {
  const post = url.searchParams.get("post");
  return post ? `${url.pathname}?post=${encodeURIComponent(post)}` : url.pathname;
}

/** Previews of unpublished posts are opened by editors, not visitors. */
export function isCounted(url: URL, globalPrivacyControl = false): boolean {
  return !url.searchParams.has("preview") && !globalPrivacyControl;
}

export function trackVisit(endpoint: string): void {
  const url = new URL(window.location.href);
  const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;
  if (!endpoint || !isCounted(url, gpc === true) || typeof navigator.sendBeacon !== "function") {
    return;
  }

  // text/plain needs no CORS preflight
  const body = JSON.stringify({
    path: visitPath(url),
    locale: document.documentElement.lang,
    referrer: document.referrer || null,
  });
  navigator.sendBeacon(endpoint, new Blob([body], { type: "text/plain" }));
}
