import { describe, expect, it } from "vitest";
import { buildMenu, nextOpen } from "@/lib/siteMenu";

const cat = (slug: string, name = slug) => ({ slug, name });
const today = [
  cat("ladies-watches", "Ladies Watches"),
  cat("all-products", "All Products"),
  cat("gents-watches", "Gent's Watches"),
  cat("naviforce-watches-kenya", "Naviforce"),
  cat("casio-watches-kenya", "Casio"),
  cat("featured", "Editor's Picks"),
  cat("customizable-gifts", "Customizable Gifts"),
];

describe("the homepage category menu", () => {
  it("puts Gent's and Ladies first, in that order, whatever order the store sends them", () => {
    expect(buildMenu(today).primary.map((c) => c.slug).slice(0, 2)).toEqual(["gents-watches", "ladies-watches"]);
  });

  it("leaves All Products and Editor's Picks out of the row, because the Shop link and the home page sections already cover them", () => {
    const menu = buildMenu(today);
    const everything = [...menu.primary, ...menu.groups.flatMap((g) => g.items), ...menu.seasonal].map((c) => c.slug);
    expect(everything).not.toContain("all-products");
    expect(everything).not.toContain("featured");
  });

  it("gathers the brands under one Brands menu, Casio before Naviforce", () => {
    const brands = buildMenu(today).groups.find((g) => g.label === "Brands");
    expect(brands?.items.map((c) => c.slug)).toEqual(["casio-watches-kenya", "naviforce-watches-kenya"]);
  });

  it("puts any new brand category into Brands without a code change", () => {
    const menu = buildMenu([...today, cat("olevs-watches-kenya", "Olevs")]);
    expect(menu.groups.find((g) => g.label === "Brands")?.items.map((c) => c.slug)).toContain("olevs-watches-kenya");
  });

  it("shows a menu with a single category as that category itself, not as a menu with one entry", () => {
    const menu = buildMenu(today);
    expect(menu.groups.find((g) => g.label === "Gifts")).toBeUndefined();
    expect(menu.primary.map((c) => c.slug)).toContain("customizable-gifts");
  });

  it("makes a Gifts menu once there are two gift categories", () => {
    const menu = buildMenu([...today, cat("corporate-gifts", "Corporate Gifts")]);
    expect(menu.groups.find((g) => g.label === "Gifts")?.items.map((c) => c.slug)).toEqual(["corporate-gifts", "customizable-gifts"]);
  });

  it("lists the seasonal pages last and only when the store shows them", () => {
    expect(buildMenu(today).seasonal).toEqual([]);
    const menu = buildMenu([...today, cat("valentines-gifts", "Valentine's Gifts")]);
    expect(menu.seasonal.map((c) => c.slug)).toEqual(["valentines-gifts"]);
  });

  it("keeps a category it does not know about, under More, so nothing disappears from the shop", () => {
    const menu = buildMenu([...today, cat("watch-straps", "Watch Straps"), cat("watch-boxes", "Watch Boxes")]);
    expect(menu.groups.find((g) => g.label === "More")?.items.map((c) => c.slug)).toEqual(["watch-straps", "watch-boxes"]);
  });

  it("does not make up categories the store did not send, so a hidden one never shows", () => {
    expect(buildMenu([cat("gents-watches", "Gent's Watches")]).groups).toEqual([]);
  });

  it("keeps the row short however many categories there are", () => {
    const many = [
      ...today,
      ...["curren", "poedagar", "crrju", "olevs", "hannah-martin", "reward"].map((b) => cat(`${b}-watches-kenya`, b)),
      cat("gift-packages"), cat("birthday-gifts"), cat("corporate-gifts"),
    ];
    const menu = buildMenu(many);
    expect(menu.primary.length + menu.groups.length + menu.seasonal.length).toBeLessThanOrEqual(5);
  });
});

describe("opening a menu", () => {
  it("opens the one pressed, closes it when pressed again, and swaps when another is pressed", () => {
    expect(nextOpen(null, "Brands")).toBe("Brands");
    expect(nextOpen("Brands", "Brands")).toBeNull();
    expect(nextOpen("Brands", "Gifts")).toBe("Gifts");
  });
});
