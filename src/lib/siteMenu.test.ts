import { describe, expect, it } from "vitest";
import { buildMenu, clampLeft, closed, hoverIn, hoverOut, press } from "@/lib/siteMenu";

const cat = (slug: string, name = slug, visible?: boolean) => ({ slug, name, visible });
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
  it("puts All Products first, then Gent's and Ladies, whatever order the store sends them", () => {
    expect(buildMenu(today).primary.map((c) => c.slug).slice(0, 3)).toEqual(["all-products", "gents-watches", "ladies-watches"]);
  });

  it("leaves All Products out only when the store does not show it", () => {
    expect(buildMenu(today.filter((c) => c.slug !== "all-products")).primary.map((c) => c.slug)).not.toContain("all-products");
    expect(buildMenu(today.map((c) => (c.slug === "all-products" ? { ...c, visible: false } : c))).primary.map((c) => c.slug)).not.toContain("all-products");
  });

  it("leaves Editor's Picks out of the row, because the Customer Favourites section on the home page already is that", () => {
    const menu = buildMenu(today);
    const everything = [...menu.primary, ...menu.groups.flatMap((g) => g.items), ...menu.seasonal].map((c) => c.slug);
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

  it("skips a category the store marks as hidden, even if it is a known one", () => {
    const menu = buildMenu([cat("gents-watches", "Gent's Watches"), cat("valentines-gifts", "Valentine's Gifts", false), cat("olevs-watches-kenya", "Olevs", false)]);
    const everything = [...menu.primary, ...menu.groups.flatMap((g) => g.items), ...menu.seasonal].map((c) => c.slug);
    expect(everything).toEqual(["gents-watches"]);
  });

  it("shows Gifts as the one gift entry when the Gifts page is visible, folding Customizable Gifts into it", () => {
    const menu = buildMenu([...today, cat("gifts", "Gifts")]);
    const row = menu.primary.map((c) => c.slug);
    expect(row).toContain("gifts");
    expect(row).not.toContain("customizable-gifts");
    expect(menu.groups.find((g) => g.label === "Gifts")).toBeUndefined();
  });

  it("makes Gifts a menu that starts with All Gifts once there is more than one gift page", () => {
    const menu = buildMenu([...today, cat("gifts", "Gifts"), cat("corporate-gifts", "Corporate Gifts")]);
    const gifts = menu.groups.find((g) => g.label === "Gifts");
    expect(gifts?.items.map((c) => c.slug)).toEqual(["gifts", "corporate-gifts", "customizable-gifts"]);
    expect(gifts?.items[0].name).toBe("All Gifts");
    expect(menu.primary.map((c) => c.slug)).not.toContain("gifts");
  });

  it("falls back to the gift pages themselves when the Gifts page is hidden", () => {
    const menu = buildMenu([...today, cat("gifts", "Gifts", false)]);
    expect(menu.primary.map((c) => c.slug)).toContain("customizable-gifts");
    expect(menu.primary.map((c) => c.slug)).not.toContain("gifts");
  });

  it("never lists the Brands page itself, because the Brands menu is the entry for it", () => {
    const menu = buildMenu([...today, cat("brands", "Brands")]);
    const everything = [...menu.primary, ...menu.groups.flatMap((g) => g.items), ...menu.seasonal].map((c) => c.slug);
    expect(everything).not.toContain("brands");
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

describe("opening a menu by hover and by click", () => {
  it("opens a menu when the pointer rests on its button, without pinning it", () => {
    expect(hoverIn(closed, "Brands")).toEqual({ open: "Brands", pinned: false });
  });

  it("closes a menu that was only hovered when the pointer leaves", () => {
    expect(hoverOut(hoverIn(closed, "Brands"))).toEqual(closed);
  });

  it("pins a menu when its button is clicked, so leaving no longer closes it", () => {
    const pinned = press(closed, "Brands");
    expect(pinned).toEqual({ open: "Brands", pinned: true });
    expect(hoverOut(pinned)).toEqual(pinned);
  });

  it("pins a menu that was open from hovering instead of closing it when the button is clicked", () => {
    expect(press(hoverIn(closed, "Brands"), "Brands")).toEqual({ open: "Brands", pinned: true });
  });

  it("closes a pinned menu when its button is clicked again", () => {
    expect(press(press(closed, "Brands"), "Brands")).toEqual(closed);
  });

  it("swaps to another menu when its button is hovered, and keeps the pin if there was one", () => {
    expect(hoverIn(hoverIn(closed, "Brands"), "Gifts")).toEqual({ open: "Gifts", pinned: false });
    expect(hoverIn(press(closed, "Brands"), "Gifts")).toEqual({ open: "Gifts", pinned: true });
  });

  it("opens and pins a different menu when its button is clicked while another is open", () => {
    expect(press(press(closed, "Brands"), "Gifts")).toEqual({ open: "Gifts", pinned: true });
  });
});

describe("placing a dropdown under its button", () => {
  it("lines it up with the button's left edge", () => {
    expect(clampLeft(300, 208, 1200)).toBe(300);
  });

  it("pulls it back in when it would run past the right edge", () => {
    expect(clampLeft(1100, 208, 1200)).toBe(992);
  });

  it("never lets it start left of the page", () => {
    expect(clampLeft(-20, 208, 1200)).toBe(0);
  });
});
