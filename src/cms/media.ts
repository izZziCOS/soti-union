/**
 * Pictures of the CMS media library: their sizes (srcset) and focal point, the part
 * that stays visible when a picture is cropped (set in the CMS panel).
 */
import { webUrl } from "./url.ts";

/** A picture as the CMS API returns it. */
export interface CmsImage {
  url: string;
  thumb_url: string;
  alt: string | null;
  width?: number | null;
  height?: number | null;
  srcset?: string | null;
  focal?: { x: number; y: number } | null;
}

/**
 * The Tailwind class that crops a picture around its focal point, rounded to 10 %.
 * The strict CSP forbids inline styles, so every one of these classes is generated
 * up front (the `@source inline` line in global.css). Null for the centre, which is
 * what `object-cover` does anyway.
 */
export function focalClass(focal: CmsImage["focal"]): string | null {
  if (!focal) return null;
  const round = (value: number) => Math.min(Math.max(Math.round(value / 10) * 10, 0), 100);
  const x = round(focal.x);
  const y = round(focal.y);
  return x === 50 && y === 50 ? null : `object-[${x}%_${y}%]`;
}

/**
 * The srcset of a CMS picture with every address checked like other CMS links
 * (http(s) only, made absolute against `base`); null when nothing usable is left.
 */
export function safeSrcset(srcset: string | null | undefined, base?: string): string | null {
  if (!srcset) return null;
  const candidates = srcset.split(",").flatMap((candidate) => {
    const [address, width] = candidate.trim().split(/\s+/);
    const url = webUrl(address, base);
    return url && width && /^\d+w$/.test(width) ? [`${url} ${width}`] : [];
  });
  return candidates.length > 0 ? candidates.join(", ") : null;
}
