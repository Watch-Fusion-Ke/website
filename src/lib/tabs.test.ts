import { describe, expect, it } from "vitest";
import { TABS, activeTab } from "@/lib/tabs";

describe("TABS", () => {
  it("are Home, Shop, Search and Cart, in that order", () => {
    expect(TABS.map((t) => t.label)).toEqual(["Home", "Shop", "Search", "Cart"]);
  });

  it("opens the full catalogue from Shop and uses a button for Search", () => {
    const href = (key: string) => TABS.find((t) => t.key === key)?.href;
    expect(href("shop")).toBe("/shop");
    expect(href("search")).toBeUndefined();
    expect(href("cart")).toBe("/cart");
  });

  it("keep every tab inside the site, so no tab opens WhatsApp", () => {
    expect(TABS.every((t) => !t.href || t.href.startsWith("/"))).toBe(true);
  });
});

describe("activeTab", () => {
  it("marks Home only on the homepage", () => {
    expect(activeTab("/", null)).toBe("home");
    expect(activeTab("/contact", null)).toBeNull();
  });

  it("marks Shop on the full catalogue and its category pages", () => {
    expect(activeTab("/shop", null)).toBe("shop");
    expect(activeTab("/shop", "")).toBe("shop");
    expect(activeTab("/list", null)).toBeNull();
  });

  it("marks Search on search results", () => {
    expect(activeTab("/shop", "MEGIR")).toBe("search");
    expect(activeTab("/shop", "  ")).toBe("shop");
  });

  it("marks Cart on the cart page", () => {
    expect(activeTab("/cart", null)).toBe("cart");
  });

  it("does not mark Cart on a product whose address merely starts with 'cart'", () => {
    expect(activeTab("/cartier-style-watch", null)).toBeNull();
    expect(activeTab("/cartoon-kids-watch", null)).toBeNull();
  });
});
