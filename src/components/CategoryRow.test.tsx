import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import CategoryRow from "@/components/CategoryRow";
import type { SiteMenu } from "@/lib/siteMenu";

const link = (name: string, slug: string, seasonal?: boolean) => ({ kind: "link" as const, category: { name, slug }, seasonal });
const menu: SiteMenu = {
  row: [
    { kind: "menu", group: { label: "Watch Brands", items: [{ name: "Casio", slug: "casio-watches-kenya" }, { name: "Naviforce", slug: "naviforce-watches-kenya" }] } },
    link("Customizable Gifts", "customizable-gifts"),
    link("Valentine's Gifts", "valentines-gifts", true),
    link("Gent's Watches", "gents-watches"),
    link("Ladies Watches", "ladies-watches"),
    { kind: "menu", group: { label: "More", items: [{ name: "Corporate Gifts", slug: "corporate-gifts" }, { name: "Birthday Gifts", slug: "birthday-gifts" }] } },
    link("All Products", "all-products"),
  ],
};
const html = renderToStaticMarkup(<CategoryRow menu={menu} />);

describe("CategoryRow", () => {
  it("is a navigation landmark with its own name, apart from the Shop page's category pills", () => {
    expect(html).toMatch(/<nav[^>]*aria-label="Shop by category"/);
  });

  it("links the main categories straight to the shop", () => {
    expect(html).toContain('href="/shop?cat=gents-watches"');
    expect(html).toContain('href="/shop?cat=ladies-watches"');
  });

  it("sends All Products to the plain shop page, wherever the menu puts it", () => {
    expect(html).toContain('href="/shop"');
    expect(html).not.toContain("cat=all-products");
    expect(html.indexOf('href="/shop"')).toBeGreaterThan(html.indexOf('href="/shop?cat=ladies-watches"'));
  });

  it("shows each menu as a button that starts closed and says what it controls", () => {
    const buttons = html.match(/<button[^>]*>/g) ?? [];
    expect(buttons).toHaveLength(2);
    for (const b of buttons) {
      expect(b).toContain('aria-expanded="false"');
      expect(b).toMatch(/aria-controls="[^"]+"/);
    }
  });

  it("keeps the links inside every menu in the page, hidden until opened, so they can still be found and followed", () => {
    expect(html).toContain('href="/shop?cat=casio-watches-kenya"');
    expect(html).toContain('href="/shop?cat=corporate-gifts"');
    expect(html.match(/<div[^>]*hidden=""[^>]*>/g) ?? []).toHaveLength(2);
  });

  it("keeps the row in the order the menu gives, with a menu button between the links either side of it", () => {
    const at = (needle: string) => html.indexOf(needle);
    const order = ["Watch Brands", 'href="/shop?cat=customizable-gifts"', 'href="/shop?cat=valentines-gifts"', 'href="/shop?cat=gents-watches"', 'href="/shop?cat=ladies-watches"', ">More<", 'href="/shop"'];
    const places = order.map(at);
    expect(places.every((p) => p > -1)).toBe(true);
    expect(places).toEqual([...places].sort((x, y) => x - y));
  });

  it("shows a seasonal page as a gold highlighted link", () => {
    const link = html.match(/<a[^>]*href="\/shop\?cat=valentines-gifts"[^>]*>/)?.[0] ?? "";
    expect(link).toContain("bg-brand-gold");
  });

  it("keeps the dropdown light: a thin border and a small shadow, not a heavy one", () => {
    const source = readFileSync("src/components/CategoryRow.tsx", "utf8");
    expect(source).not.toMatch(/shadow-(xl|2xl)/);
    expect(source).toMatch(/shadow-sm/);
  });

  it("opens a menu when the pointer rests on its button, and keeps it while the pointer is over the box", () => {
    const source = readFileSync("src/components/CategoryRow.tsx", "utf8");
    expect(source).toContain("onPointerEnter");
    expect(source).toContain("onPointerLeave");
  });

  it("really hides a closed menu: its box carries no display class that would override the hidden attribute", () => {
    const panels = html.match(/<div[^>]*hidden=""[^>]*>/g) ?? [];
    expect(panels).toHaveLength(2);
    for (const panel of panels) {
      const classes = panel.match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
      expect(classes.filter((c) => /^(flex|block|grid|inline|inline-flex|absolute)$/.test(c))).toEqual([]);
    }
  });

  it("gives each menu a list of links with the menu's name, to open as a floating dropdown", () => {
    expect(html).toMatch(/<ul[^>]*aria-label="Watch Brands"/);
    expect(html).toMatch(/<ul[^>]*aria-label="More"/);
  });

  it("keeps the opened links inside the navigation landmark, so a screen reader finds them under it", () => {
    expect(html.indexOf('hidden=""')).toBeGreaterThan(-1);
    expect(html.lastIndexOf('hidden=""')).toBeLessThan(html.indexOf("</nav>"));
  });

  it("gives the plain-text links no white background class, which the dark theme would turn into a grey box behind each word", () => {
    const link = html.match(/<a[^>]*href="\/shop\?cat=gents-watches"[^>]*>/)?.[0] ?? "";
    expect(link).not.toMatch(/(^|\s|")bg-white(\s|")/);
    expect(link).toContain("max-md:bg-[var(--surface)]");
  });

  it("makes the phone pills at least 44 px tall to tap", () => {
    for (const tag of [html.match(/<a[^>]*href="\/shop\?cat=gents-watches"[^>]*>/)?.[0] ?? "", html.match(/<button[^>]*>/)?.[0] ?? ""]) {
      expect(tag).toContain("min-h-11");
    }
  });

  it("renders nothing when there are no categories", () => {
    expect(renderToStaticMarkup(<CategoryRow menu={{ row: [] }} />)).toBe("");
  });

  it("uses the site font and no main heading", () => {
    const source = readFileSync("src/components/CategoryRow.tsx", "utf8");
    expect(source).not.toMatch(/fontFamily|Futura/);
    expect(source).not.toMatch(/<h1[\s>]/);
  });

  it("wraps onto a second line on a phone, so every entry can be seen without sliding the row sideways", () => {
    const row = html.match(/<div class="([^"]*flex-wrap[^"]*)"/)?.[1].split(" ") ?? [];
    expect(row).toContain("flex-wrap");
    expect(row).toContain("justify-center");
    expect(row).not.toContain("overflow-x-auto");
    expect(html).not.toContain("bg-gradient-to-l");
  });
});
