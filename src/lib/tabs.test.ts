import { describe, expect, it } from "vitest";
import { TABS, activeTab } from "@/lib/tabs";

describe("TABS", () => {
  it("are Home, Gents, Ladies and Cart, in that order", () => {
    expect(TABS.map((t) => t.label)).toEqual(["Home", "Gents", "Ladies", "Cart"]);
  });

  it("send Gents and Ladies to the store's two watch categories", () => {
    const href = (key: string) => TABS.find((t) => t.key === key)?.href;
    expect(href("gents")).toBe("/shop?cat=gents-watches");
    expect(href("ladies")).toBe("/shop?cat=ladies-watches");
    expect(href("cart")).toBe("/cart");
  });

  it("keep every tab inside the site, so no tab opens WhatsApp", () => {
    expect(TABS.every((t) => t.href.startsWith("/"))).toBe(true);
  });
});

describe("activeTab", () => {
  it("marks Home only on the homepage", () => {
    expect(activeTab("/", null)).toBe("home");
    expect(activeTab("/contact", null)).toBeNull();
  });

  it("marks Gents and Ladies on their category pages of the shop", () => {
    expect(activeTab("/shop", "gents-watches")).toBe("gents");
    expect(activeTab("/shop", "ladies-watches")).toBe("ladies");
    expect(activeTab("/list", "gents-watches")).toBeNull(); // the old address only redirects
  });

  it("marks nothing on other categories or on the whole shop", () => {
    expect(activeTab("/list", "naviforce-watches-kenya")).toBeNull();
    expect(activeTab("/shop", null)).toBeNull();
  });

  it("marks Cart on the cart page", () => {
    expect(activeTab("/cart", null)).toBe("cart");
  });

  it("does not mark Cart on a product whose address merely starts with 'cart'", () => {
    expect(activeTab("/cartier-style-watch", null)).toBeNull();
    expect(activeTab("/cartoon-kids-watch", null)).toBeNull();
  });
});
