import { describe, expect, it } from "vitest";
import { isCounted, visitPath } from "~/scripts/visits";

describe("visitPath", () => {
  it("keeps the path and the news post, and drops other parameters", () => {
    expect(visitPath(new URL("https://sotiunion.com/lt/about/?utm_source=x"))).toBe("/lt/about/");
    expect(visitPath(new URL("https://sotiunion.com/news/?post=new-crane&fbclid=1"))).toBe(
      "/news/?post=new-crane",
    );
  });
});

describe("isCounted", () => {
  it("skips post previews and visitors asking not to be tracked", () => {
    expect(isCounted(new URL("https://sotiunion.com/news/"))).toBe(true);
    expect(isCounted(new URL("https://sotiunion.com/news/?post=a&preview=token"))).toBe(false);
    expect(isCounted(new URL("https://sotiunion.com/"), true)).toBe(false);
  });
});
