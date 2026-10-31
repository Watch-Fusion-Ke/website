import { describe, expect, it } from "vitest";
import { PHONE_FOCUS_SLUG, SITE_PAGES, buildMenu, drawerMenu, lastVisibleRight, pagesOnly, centreScrollLeft, clampLeft, closed, hoverIn, hoverOut, phoneOrder, press, scrollEdges, type SiteMenu } from "@/lib/siteMenu";

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
  it("reads in the order the shop asked for: Watch Brands, Customizable Gifts, Christmas Gifts, then the rest, All Products, and the More menu at the very end", () => {
    expect(names(buildMenu(today))).toEqual(["[Watch Brands]", "Customizable Gifts", "Christmas Gifts", "Gent's Watches", "Ladies Watches", "All Products", "[More]"]);
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

  it("shows Men and Women under Casio, in the brands menu, when the store shows those two pages", () => {
    const menu = buildMenu([...today, cat("casio-men", "Casio Men"), cat("casio-women", "Casio Women")]);
    const casio = menuOf(menu, "Watch Brands")?.items.find((c) => c.slug === "casio-watches-kenya");
    expect(casio?.children?.map((c) => [c.name, c.slug])).toEqual([["Men", "casio-men"], ["Women", "casio-women"]]);
  });

  it("does not list Casio Men and Casio Women again as brands of their own, or under More", () => {
    const menu = buildMenu([...today, cat("casio-men", "Casio Men"), cat("casio-women", "Casio Women")]);
    expect(menuOf(menu, "Watch Brands")?.items.map((c) => c.slug)).toEqual(["casio-watches-kenya", "naviforce-watches-kenya"]);
    expect(menuOf(menu, "More")?.items).toEqual([]);
    expect(names(menu)).not.toContain("Casio Men");
  });

  it("shows only the Casio pages the store shows, and none when it shows neither", () => {
    const one = buildMenu([...today, cat("casio-men", "Casio Men"), cat("casio-women", "Casio Women", false)]);
    expect(menuOf(one, "Watch Brands")?.items[0].children?.map((c) => c.slug)).toEqual(["casio-men"]);
    const none = buildMenu(today);
    expect(menuOf(none, "Watch Brands")?.items[0].children).toBeUndefined();
  });

  it("keeps the brands menu, so Men and Women still show, when Casio is the only brand the store shows", () => {
    const menu = buildMenu([...today.filter((c) => c.slug !== "naviforce-watches-kenya"), cat("casio-men", "Casio Men"), cat("casio-women", "Casio Women")]);
    const brands = menuOf(menu, "Watch Brands");
    expect(brands?.items.map((c) => c.slug)).toEqual(["casio-watches-kenya"]);
    expect(brands?.items[0].children?.map((c) => c.slug)).toEqual(["casio-men", "casio-women"]);
  });

  it("still shows a lone brand with no pages as a plain link", () => {
    expect(menuOf(buildMenu(today.filter((c) => c.slug !== "naviforce-watches-kenya")), "Watch Brands")).toBeUndefined();
  });

  it("gives no other brand a submenu", () => {
    const menu = buildMenu([...today, cat("casio-men", "Casio Men"), cat("casio-women", "Casio Women")]);
    expect(menuOf(menu, "Watch Brands")?.items.filter((c) => c.children).map((c) => c.slug)).toEqual(["casio-watches-kenya"]);
  });

  it("drops the brand's name from the start of a page's label, whatever the page is called", () => {
    const menu = buildMenu([...today, cat("casio-men", "Casio Men's Watches"), cat("casio-women", "Women")]);
    expect(menuOf(menu, "Watch Brands")?.items[0].children?.map((c) => c.name)).toEqual(["Men's Watches", "Women"]);
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

  it("marks seasonal pages, so they can be shown highlighted, and puts them right after Customizable Gifts, ahead of the watches", () => {
    const menu = buildMenu([...today, cat("valentines-gifts", "Valentine's Gifts")]);
    expect(menu.row.filter((e) => e.kind === "link" && e.seasonal).map((e) => (e.kind === "link" ? e.category.slug : ""))).toEqual(["christmas-gift-packages", "valentines-gifts"]);
    expect(names(menu).slice(0, 4)).toEqual(["[Watch Brands]", "Customizable Gifts", "Christmas Gifts", "Valentine's Gifts"]);
  });

  it("lists seasonal pages only when the store shows them", () => {
    expect(names(buildMenu(today.filter((c) => c.slug !== "christmas-gift-packages")))).not.toContain("Christmas Gifts");
  });

  it("lets the other gift pages follow the watches, in the More menu at the end of the row", () => {
    const menu = buildMenu([...today, cat("gift-packages", "Gift Packages"), cat("corporate-gifts", "Corporate Gifts"), cat("birthday-gifts", "Birthday Gifts")]);
    expect(names(menu).slice(-3)).toEqual(["Ladies Watches", "All Products", "[More]"]);
    expect(menuOf(menu, "More")?.items.map((c) => c.slug)).toEqual(["gift-packages", "birthday-gifts", "corporate-gifts"]);
  });

  it("keeps a lone other gift page in the More menu, not as a link of its own, so the row's order stays the shop's", () => {
    const menu = buildMenu([...today, cat("gift-packages", "Gift Packages")]);
    expect(names(menu).slice(-2)).toEqual(["All Products", "[More]"]);
    expect(menuOf(menu, "More")?.items.map((c) => c.slug)).toEqual(["gift-packages"]);
  });

  it("keeps a category it does not know about, under More, so nothing disappears from the shop", () => {
    const menu = buildMenu([...today, cat("gift-packages", "Gift Packages"), cat("watch-straps", "Watch Straps")]);
    expect(menuOf(menu, "More")?.items.map((c) => c.slug)).toEqual(["gift-packages", "watch-straps"]);
  });

  it("does not make up categories the store did not send, so a hidden one never shows", () => {
    expect(names(buildMenu([cat("gents-watches", "Gent's Watches")]))).toEqual(["Gent's Watches", "[More]"]);
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

describe("opening the phone row centred on one entry", () => {
  // item left, item width, the row's visible width, the row's whole content width
  it("puts the entry's middle in the middle of the visible row", () => {
    expect(centreScrollLeft(300, 100, 390, 700)).toBe(155); // 300 + 50 - 195
  });

  it("never scrolls to before the start, for an entry near the left", () => {
    expect(centreScrollLeft(10, 100, 390, 700)).toBe(0);
  });

  it("never scrolls past the end, for an entry near the right", () => {
    expect(centreScrollLeft(620, 100, 390, 700)).toBe(310); // the most it can move: 700 - 390
  });

  it("does not move a row that already fits, as on a computer", () => {
    expect(centreScrollLeft(300, 100, 1200, 900)).toBe(0);
    expect(centreScrollLeft(300, 100, 900, 900)).toBe(0);
  });

  it("copes with sizes that are not whole numbers or not there", () => {
    expect(centreScrollLeft(300.5, 99.5, 390, 700)).toBeCloseTo(155.25);
    expect(centreScrollLeft(NaN, 100, 390, 700)).toBe(0);
  });
});

describe("which ends of the phone row have more beyond them", () => {
  it("has more to the right only, at the start", () => {
    expect(scrollEdges(0, 390, 700)).toEqual({ atStart: true, atEnd: false });
  });

  it("has more on both sides in the middle", () => {
    expect(scrollEdges(155, 390, 700)).toEqual({ atStart: false, atEnd: false });
  });

  it("has more to the left only, at the end, allowing a pixel of rounding", () => {
    expect(scrollEdges(310, 390, 700)).toEqual({ atStart: false, atEnd: true });
    expect(scrollEdges(309.4, 390, 700)).toEqual({ atStart: false, atEnd: true });
  });

  it("has nothing beyond either end when everything fits", () => {
    expect(scrollEdges(0, 1200, 900)).toEqual({ atStart: true, atEnd: true });
  });
});

describe("the order of the phone row", () => {
  const link = (slug: string) => ({ kind: "link" as const, category: { name: slug, slug } });
  const menu = (label: string) => ({ kind: "menu" as const, group: { label, items: [{ name: "x", slug: "x" }, { name: "y", slug: "y" }] } });

  it("is named after the Christmas page, the entry the phone row is built around", () => {
    expect(PHONE_FOCUS_SLUG).toBe("christmas-gift-packages");
  });

  it("starts with the first entry and puts Christmas right after it, then the rest in their usual order", () => {
    const row = [menu("Watch Brands"), link("customizable-gifts"), link(PHONE_FOCUS_SLUG), link("gents-watches"), link("ladies-watches"), link("all-products")];
    // each entry's place on a phone: Watch Brands 0, Customizable 2, Christmas 1, Gent's 3, Ladies 4, All 5
    expect(phoneOrder(row)).toEqual([0, 2, 1, 3, 4, 5]);
  });

  it("leaves the order alone when there is no Christmas entry", () => {
    expect(phoneOrder([menu("Watch Brands"), link("gents-watches"), link("ladies-watches")])).toEqual([0, 1, 2]);
  });

  it("leaves the order alone when Christmas is already second or first", () => {
    expect(phoneOrder([menu("Watch Brands"), link(PHONE_FOCUS_SLUG), link("gents-watches")])).toEqual([0, 1, 2]);
    expect(phoneOrder([link(PHONE_FOCUS_SLUG), menu("Watch Brands"), link("gents-watches")])).toEqual([0, 1, 2]);
  });

  it("copes with a row of one, or none", () => {
    expect(phoneOrder([link(PHONE_FOCUS_SLUG)])).toEqual([0]);
    expect(phoneOrder([])).toEqual([]);
  });

  it("moves Christmas to second place wherever it sits further along", () => {
    const row = [link("a"), link("b"), link("c"), link("d"), link(PHONE_FOCUS_SLUG)];
    expect(phoneOrder(row)).toEqual([0, 2, 3, 4, 1]);
  });
});

describe("fading only when real content is hidden", () => {
  // The row's padding and each entry's own tap padding are empty space, so scrolling past only that hides no words.
  it("counts a row scrolled past only empty padding as being at its start or end", () => {
    expect(scrollEdges(24, 360, 642, 28)).toEqual({ atStart: true, atEnd: false });
    expect(scrollEdges(258, 360, 642, 28)).toEqual({ atStart: false, atEnd: true });
  });

  it("fades as soon as a word is hidden", () => {
    expect(scrollEdges(40, 360, 642, 28)).toEqual({ atStart: false, atEnd: false });
    expect(scrollEdges(250, 360, 642, 28)).toEqual({ atStart: false, atEnd: false });
  });

  it("allows only a pixel of rounding when no padding allowance is given", () => {
    expect(scrollEdges(24, 360, 642)).toEqual({ atStart: false, atEnd: false });
  });
});

describe("the More menu, which replaces the page links that used to sit in the header", () => {
  const pagesOf = (menu: SiteMenu) => menuOf(menu, "More")?.pages?.map((p) => [p.name, p.href]);

  it("closes the row, after All Products, so the shop's own order is untouched", () => {
    const row = names(buildMenu(today));
    expect(row.slice(0, -1)).toEqual(["[Watch Brands]", "Customizable Gifts", "Christmas Gifts", "Gent's Watches", "Ladies Watches", "All Products"]);
    expect(row[row.length - 1]).toBe("[More]");
  });

  it("lists Deals and Gift Vouchers, and leaves out Homepage, which the logo already is, and Contact, which the footer has", () => {
    expect(pagesOf(buildMenu(today))).toEqual([["Deals", "/deals"], ["Gift Vouchers", "/gift-vouchers"]]);
  });

  it("lists Shop too when the store shows no All Products page, so the whole shop is never out of reach", () => {
    const without = buildMenu(today.filter((c) => c.slug !== "all-products"));
    expect(pagesOf(without)?.map(([name]) => name)).toContain("Shop");
    expect(pagesOf(buildMenu(today))?.map(([name]) => name)).not.toContain("Shop");
  });

  it("is still there when the store sends an empty list or hides every category, so the pages stay reachable", () => {
    expect(names(buildMenu([]))).toEqual(["[More]"]);
  });

  it("holds the other gift pages in the same menu, ahead of the pages, so there is never two More entries", () => {
    const menu = buildMenu([...today, cat("gift-packages", "Gift Packages"), cat("watch-straps", "Watch Straps")]);
    expect(names(menu).filter((n) => n === "[More]")).toHaveLength(1);
    expect(menuOf(menu, "More")?.items.map((c) => c.slug)).toEqual(["gift-packages", "watch-straps"]);
    expect(pagesOf(menu)).toHaveLength(2);
  });

  it("keeps the whole list of pages for the phone's menu drawer, which still shows Homepage and Contact", () => {
    expect(SITE_PAGES.map((p) => p.href)).toEqual(["/", "/shop", "/deals", "/gift-vouchers", "/contact"]);
  });
});

describe("which entry of the row is the last one on screen", () => {
  it("is the last entry that has a size", () => {
    expect(lastVisibleRight([{ right: 100, width: 80 }, { right: 300, width: 90 }], 999)).toBe(300);
  });

  it("skips an entry that is not shown (it has no size, as a hidden More on a phone), so a dropdown is not placed against a zero", () => {
    expect(lastVisibleRight([{ right: 100, width: 80 }, { right: 300, width: 90 }, { right: 0, width: 0 }], 999)).toBe(300);
  });

  it("falls back to the given edge when nothing is shown", () => {
    expect(lastVisibleRight([], 500)).toBe(500);
    expect(lastVisibleRight([{ right: 0, width: 0 }], 500)).toBe(500);
  });
});

describe("a menu that holds only the site's pages", () => {
  it("is told apart from one that holds categories", () => {
    expect(pagesOnly({ label: "More", items: [], pages: [{ name: "Deals", href: "/deals" }] })).toBe(true);
    expect(pagesOnly({ label: "More", items: [{ name: "Gift Packages", slug: "gift-packages" }], pages: [{ name: "Deals", href: "/deals" }] })).toBe(false);
    expect(pagesOnly({ label: "Watch Brands", items: [{ name: "Casio", slug: "casio" }] })).toBe(false);
    expect(pagesOnly({ label: "More", items: [] })).toBe(false);
  });
});

describe("the menu drawer, built from the same menu as the row", () => {
  const withCasio = [...today, cat("casio-men", "Casio Men"), cat("casio-women", "Casio Women")];
  const flat = (sections: ReturnType<typeof drawerMenu>["sections"]) => sections.map((s) => [s.heading ?? "", s.links.map((l) => `${l.depth}:${l.name}`)]);

  it("lists the categories in the phone's order: Watch Brands, then Christmas, Customizable Gifts, Gent's, Ladies, All Products", () => {
    expect(flat(drawerMenu(today).sections)).toEqual([
      ["Watch Brands", ["0:Casio", "0:Naviforce"]],
      ["", ["0:Christmas Gifts", "0:Customizable Gifts", "0:Gent's Watches", "0:Ladies Watches", "0:All Products"]],
    ]);
  });

  it("shows Men and Women inside Casio, one step in, and never as categories of their own", () => {
    const sections = drawerMenu(withCasio).sections;
    expect(sections[0].links.map((l) => `${l.depth}:${l.name}`)).toEqual(["0:Casio", "1:Men", "1:Women", "0:Naviforce"]);
    expect(sections.flatMap((s) => s.links).filter((l) => l.depth === 0).map((l) => l.name)).not.toContain("Casio Men");
  });

  it("lists only Deals and Gift Vouchers as pages, the same as the row's More menu, with no Homepage, Contact or second Shop link", () => {
    expect(drawerMenu(today).pages.map((p) => p.href)).toEqual(["/deals", "/gift-vouchers"]);
  });

  it("lists Shop as a page when the store shows no All Products", () => {
    expect(drawerMenu(today.filter((c) => c.slug !== "all-products")).pages.map((p) => p.href)).toEqual(["/shop", "/deals", "/gift-vouchers"]);
  });

  it("keeps the pages when the categories have not arrived yet, with Shop among them until All Products arrives", () => {
    const empty = drawerMenu([]);
    expect(empty.sections).toEqual([]);
    expect(empty.pages.map((p) => p.href)).toEqual(["/shop", "/deals", "/gift-vouchers"]);
  });

  it("puts the other gift pages in a More section at the end, and skips a hidden category", () => {
    const menu = drawerMenu([...today, cat("gift-packages", "Gift Packages"), cat("valentines-gifts", "Valentine's Gifts", false)]);
    expect(flat(menu.sections).slice(-1)).toEqual([["More", ["0:Gift Packages"]]]);
    expect(menu.sections.flatMap((s) => s.links.map((l) => l.name))).not.toContain("Valentine's Gifts");
  });
});
