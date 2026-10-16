import { describe, expect, it } from "vitest";
import { TABS, activeTab } from "@/lib/tabs";
import { WHATSAPP_URL } from "@/lib/contact";

describe("TABS", () => {
  it("are Home, Gents, Ladies, Cart and Chat, in that order", () => {
    expect(TABS.map((t) => t.label)).toEqual(["Home", "Gents", "Ladies", "Cart", "Chat"]);
  });

  it("send Gents and Ladies to the store's two watch categories", () => {
    const href = (key: string) => TABS.find((t) => t.key === key)?.href;
    expect(href("gents")).toBe("/list?cat=gents-watches");
    expect(href("ladies")).toBe("/list?cat=ladies-watches");
    expect(href("cart")).toBe("/cart");
  });

  it("send Chat to WhatsApp", () => {
    expect(TABS.find((t) => t.key === "chat")?.href).toBe(WHATSAPP_URL);
    expect(WHATSAPP_URL).toBe("https://wa.me/254796044969");
  });
});

describe("activeTab", () => {
  it("marks Home only on the homepage", () => {
    expect(activeTab("/", null)).toBe("home");
    expect(activeTab("/contact", null)).toBeNull();
  });

  it("marks Gents and Ladies on their category pages, from either listing page", () => {
    expect(activeTab("/list", "gents-watches")).toBe("gents");
    expect(activeTab("/shop", "gents-watches")).toBe("gents");
    expect(activeTab("/list", "ladies-watches")).toBe("ladies");
  });

  it("marks nothing on other categories or on the whole shop", () => {
    expect(activeTab("/list", "naviforce-watches-kenya")).toBeNull();
    expect(activeTab("/shop", null)).toBeNull();
  });

  it("marks Cart on the cart page", () => {
    expect(activeTab("/cart", null)).toBe("cart");
  });

  it("never marks Chat, which leaves the site", () => {
    expect(activeTab("/anything", "x")).not.toBe("chat");
  });
});
