import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/wixClientServer", () => ({ wixClientServer: async () => ({}) }));

import { fallbackSlides } from "@/components/Slider";

describe("banner slides shown until promotions exist in the shop's content", () => {
  it("are two, as the shop owner asked", () => {
    expect(fallbackSlides).toHaveLength(2);
  });

  it("make no claim about new arrivals, because nothing in the store marks a product as new", () => {
    const text = JSON.stringify(fallbackSlides).toLowerCase();
    expect(text).not.toContain("new arrivals");
    expect(text).not.toContain("just landed");
  });

  it("each have a headline, a button and a link that stays on the site", () => {
    for (const slide of fallbackSlides) {
      expect(slide.title.length).toBeGreaterThan(0);
      expect(slide.buttonText.length).toBeGreaterThan(0);
      expect(slide.url).toMatch(/^\/(?!\/)/);
    }
  });
});
