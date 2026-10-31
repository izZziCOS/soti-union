import { describe, expect, it } from "vitest";
import { focalClass, safeSrcset } from "~/cms/media";

describe("focalClass", () => {
  it("rounds the focal point to the generated 10 % steps", () => {
    expect(focalClass({ x: 31, y: 72 })).toBe("object-[30%_70%]");
    expect(focalClass({ x: 0, y: 100 })).toBe("object-[0%_100%]");
    expect(focalClass({ x: -5, y: 140 })).toBe("object-[0%_100%]");
  });

  it("leaves the centre and missing points to object-cover", () => {
    expect(focalClass({ x: 52, y: 48 })).toBeNull();
    expect(focalClass(null)).toBeNull();
    expect(focalClass(undefined)).toBeNull();
  });
});

describe("safeSrcset", () => {
  it("keeps web addresses with their widths", () => {
    expect(safeSrcset("https://cms.test/a-640.webp 640w, https://cms.test/a.jpg 2400w")).toBe(
      "https://cms.test/a-640.webp 640w, https://cms.test/a.jpg 2400w",
    );
  });

  it("makes relative addresses absolute and drops anything else", () => {
    expect(
      safeSrcset(
        "/media/a.webp 640w, javascript:alert(1) 900w, https://cms.test/b.webp, data:x 10w",
        "https://cms.test/api",
      ),
    ).toBe("https://cms.test/media/a.webp 640w");
    expect(safeSrcset("javascript:alert(1) 640w")).toBeNull();
    expect(safeSrcset(null)).toBeNull();
  });
});
