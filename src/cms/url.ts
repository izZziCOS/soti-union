/**
 * A web address from the CMS, made absolute against `base`, or null when it is not an
 * http(s) address (`javascript:`, `data:`, malformed). Links and pictures from the CMS
 * go through this before they reach the page.
 */
export function webUrl(value: string | null | undefined, base?: string): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim(), base);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
