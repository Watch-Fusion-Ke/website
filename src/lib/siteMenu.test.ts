import { describe, expect, it } from "vitest";
import { buildMenu, clampLeft, closed, hoverIn, hoverOut, press, type SiteMenu } from "@/lib/siteMenu";

const cat = (slug: string, name = slug, visible?: boolean) => ({ slug, name, visible });
const today = [
  cat("ladies-watches", "Ladies Watches"),
  cat("all-products", "All Products"),
  cat("gents-watches", "Gent's Watches"),
  cat("naviforce-watches-kenya", "Naviforce"),
  cat("casio-watches-kenya", "Casio"),
  cat("featured", "Editor's Picks"),
  cat("customizable-gifts", "Customizable Gifts"),
  cat("christmas-gift-packages", "Christmas Gifts"),
  cat("brands", "Watch Brands"),
];

// The row as a shopper reads it: a plain entry is its name, a menu is its label in brackets.
const names = (menu: SiteMenu) => menu.row.map((e) => (e.kind === "menu" ? `[${e.group.label}]` : e.category.name));
const slugs = (menu: SiteMenu) => menu.row.flatMap((e) => (e.kind === "menu" ? e.group.items : [e.category]).map((c) => c.slug));
const menuOf = (menu: SiteMenu, label: string) => menu.row.flatMap((e) => (e.kind === "menu" && e.group.label === label ? [e.group] : []))[0];

describe("the homepage category menu", () => {
  it("reads in the order the shop asked for: All Products, Gent's, Ladies, Watch Brands, Customizable Gifts, Christmas Gifts", () => {
    expect(names(buildMenu(today))).toEqual(["All Products", "Gent's Watches", "Ladies Watches", "[Watch Brands]", "Customizable Gifts", "Christmas Gifts"]);
  });

  it("keeps that order whatever order the store sends the categories in", () => {
    expect(names(buildMenu([...today].reverse()))).toEqual(names(buildMenu(today)));
  });

  it("leaves All Products out only when the store does not show it", () => {
    expect(slugs(buildMenu(today.filter((c) => c.slug !== "all-products")))).not.toContain("all-products");
    expect(slugs(buildMenu(today.map((c) => (c.slug === "all-products" ? { ...c, visible: false } : c))))).not.toContain("all-products");
  });

  it("leaves Editor's Picks out of the row, because the Customer Favourites section on the home page already is that", () => {
    expect(slugs(buildMenu(today))).not.toContain("featured");
  });

  it("gathers the brands under one menu named after the store's Watch Brands category, Casio before Naviforce", () => {
    expect(menuOf(buildMenu(today), "Watch Brands")?.items.map((c) => c.slug)).toEqual(["casio-watches-kenya", "naviforce-watches-kenya"]);
  });

  it("calls the menu Brands when the store has no Watch Brands category to take the name from", () => {
    expect(names(buildMenu(today.filter((c) => c.slug !== "brands")))).toContain("[Brands]");
  });

  it("puts any new brand category into the brands menu without a code change", () => {
    expect(menuOf(buildMenu([...today, cat("olevs-watches-kenya", "Olevs")]), "Watch Brands")?.items.map((c) => c.slug)).toContain("olevs-watches-kenya");
  });

  it("never lists the Watch Brands page itself, because the menu is the entry for it", () => {
    expect(slugs(buildMenu(today))).not.toContain("brands");
  });

  it("shows a menu with a single category as that category itself, not as a menu with one entry", () => {
    const menu = buildMenu(today.filter((c) => c.slug !== "naviforce-watches-kenya"));
    expect(menuOf(menu, "Watch Brands")).toBeUndefined();
    expect(names(menu)).toContain("Casio");
  });

  it("shows Customizable Gifts as a link of its own, not inside a Gifts menu", () => {
    const menu = buildMenu(today);
    expect(menuOf(menu, "Gifts")).toBeUndefined();
    expect(names(menu)).toContain("Customizable Gifts");
  });

  it("marks seasonal pages, so they can be shown highlighted, and puts them right after Customizable Gifts", () => {
    const menu = buildMenu([...today, cat("valentines-gifts", "Valentine's Gifts")]);
    expect(menu.row.filter((e) => e.kind === "link" && e.seasonal).map((e) => (e.kind === "link" ? e.category.slug : ""))).toEqual(["christmas-gift-packages", "valentines-gifts"]);
    expect(names(menu).slice(4)).toEqual(["Customizable Gifts", "Christmas Gifts", "Valentine's Gifts"]);
  });

  it("lists seasonal pages only when the store shows them", () => {
    expect(names(buildMenu(today.filter((c) => c.slug !== "christmas-gift-packages")))).not.toContain("Christmas Gifts");
  });

  it("lets the other gift pages follow, after the seasonal ones, in a More menu", () => {
    const menu = buildMenu([...today, cat("gift-packages", "Gift Packages"), cat("corporate-gifts", "Corporate Gifts"), cat("birthday-gifts", "Birthday Gifts")]);
    expect(names(menu).slice(-2)).toEqual(["Christmas Gifts", "[More]"]);
    expect(menuOf(menu, "More")?.items.map((c) => c.slug)).toEqual(["gift-packages", "birthday-gifts", "corporate-gifts"]);
  });

  it("shows a lone other gift page as itself at the end of the row", () => {
    expect(names(buildMenu([...today, cat("gift-packages", "Gift Packages")])).slice(-1)).toEqual(["Gift Packages"]);
  });

  it("keeps a category it does not know about, under More, so nothing disappears from the shop", () => {
    const menu = buildMenu([...today, cat("gift-packages", "Gift Packages"), cat("watch-straps", "Watch Straps")]);
    expect(menuOf(menu, "More")?.items.map((c) => c.slug)).toEqual(["gift-packages", "watch-straps"]);
  });

  it("does not make up categories the store did not send, so a hidden one never shows", () => {
    expect(names(buildMenu([cat("gents-watches", "Gent's Watches")]))).toEqual(["Gent's Watches"]);
  });

  it("skips a category the store marks as hidden, even if it is a known one", () => {
    const menu = buildMenu([cat("gents-watches", "Gent's Watches"), cat("valentines-gifts", "Valentine's Gifts", false), cat("olevs-watches-kenya", "Olevs", false), cat("brands", "Watch Brands", false)]);
    expect(slugs(menu)).toEqual(["gents-watches"]);
  });

  it("ignores a Gifts page, because Customizable Gifts is the gift entry the shop chose", () => {
    expect(slugs(buildMenu([...today, cat("gifts", "Gifts")]))).not.toContain("gifts");
  });

  it("keeps the row short however many categories there are", () => {
    const many = [
      ...today,
      ...["curren", "poedagar", "crrju", "olevs", "hannah-martin", "reward"].map((b) => cat(`${b}-watches-kenya`, b)),
      cat("gift-packages"), cat("birthday-gifts"), cat("corporate-gifts"), cat("valentines-gifts"),
    ];
    expect(buildMenu(many).row.length).toBeLessThanOrEqual(8);
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
