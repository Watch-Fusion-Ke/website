import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import CategoryRow from "@/components/CategoryRow";
import type { SiteMenu } from "@/lib/siteMenu";

const link = (name: string, slug: string, seasonal?: boolean) => ({ kind: "link" as const, category: { name, slug }, seasonal });
const menu: SiteMenu = {
  row: [
    { kind: "menu", group: { label: "Watch Brands", items: [{ name: "Casio", slug: "casio-watches-kenya", children: [{ name: "Men", slug: "casio-men" }, { name: "Women", slug: "casio-women" }] }, { name: "Naviforce", slug: "naviforce-watches-kenya" }] } },
    link("Customizable Gifts", "customizable-gifts"),
    link("Christmas Gifts", "christmas-gift-packages", true),
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
    expect(html).toContain('href="/shop/gents-watches"');
    expect(html).toContain('href="/shop/ladies-watches"');
  });

  it("sends All Products to the plain shop page, wherever the menu puts it", () => {
    expect(html).toContain('href="/shop"');
    expect(html).not.toContain("cat=all-products");
    expect(html.indexOf('href="/shop"')).toBeGreaterThan(html.indexOf('href="/shop/ladies-watches"'));
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
    expect(html).toContain('href="/shop/casio-watches-kenya"');
    expect(html).toContain('href="/shop/corporate-gifts"');
    expect(html.match(/<div[^>]*hidden=""[^>]*>/g) ?? []).toHaveLength(2);
  });

  it("keeps the row in the order the menu gives, with a menu button between the links either side of it", () => {
    const at = (needle: string) => html.indexOf(needle);
    const order = ["Watch Brands", 'href="/shop/customizable-gifts"', 'href="/shop/christmas-gift-packages"', 'href="/shop/valentines-gifts"', 'href="/shop/gents-watches"', 'href="/shop/ladies-watches"', ">More<", 'href="/shop"'];
    const places = order.map(at);
    expect(places.every((p) => p > -1)).toBe(true);
    expect(places).toEqual([...places].sort((x, y) => x - y));
  });

  it("shows a seasonal page as a gold highlighted link", () => {
    const link = html.match(/<a[^>]*href="\/shop\/valentines-gifts"[^>]*>/)?.[0] ?? "";
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
    const link = html.match(/<a[^>]*href="\/shop\/gents-watches"[^>]*>/)?.[0] ?? "";
    expect(link).not.toMatch(/(^|\s|")bg-white(\s|")/);
    expect(link).toContain("max-md:bg-[var(--surface)]");
  });

  it("makes the phone pills at least 44 px tall to tap", () => {
    for (const tag of [html.match(/<a[^>]*href="\/shop\/gents-watches"[^>]*>/)?.[0] ?? "", html.match(/<button[^>]*>/)?.[0] ?? ""]) {
      expect(tag).toContain("min-h-11");
    }
  });

  it("keeps the phone pills as small as they can be while still easy to read and tap, so more of the row shows", () => {
    const tags = [html.match(/<a[^>]*href="\/shop\/gents-watches"[^>]*>/)?.[0] ?? "", html.match(/<button[^>]*>/)?.[0] ?? "", html.match(/<a[^>]*href="\/shop\/valentines-gifts"[^>]*>/)?.[0] ?? ""];
    for (const tag of tags) {
      const classes = tag.match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
      expect(classes).toContain("px-2.5");
      expect(classes).toContain("text-xs");
      expect(classes).toContain("min-h-11");
      expect(classes).not.toContain("px-4");
    }
    const row = html.match(/<div class="([^"]*overflow-x-auto[^"]*)"/)?.[1].split(" ") ?? [];
    expect(row).toContain("gap-1.5");
    expect(row).toContain("pr-8");
  });

  it("sits close under the header on a phone, with a smaller gap above and below than on a computer", () => {
    expect(html).toMatch(/<div class="py-3 md:py-8"/);
    expect(readFileSync("src/app/page.tsx", "utf8")).toMatch(/<div className="mt-0 md:mt-6">\s*<Suspense/);
  });

  it("lists Men and Women, indented, right under Casio in the brands menu, each a link to its own page", () => {
    const at = (needle: string) => html.indexOf(needle);
    expect(html).toContain('href="/shop/casio-men"');
    expect(html).toContain('href="/shop/casio-women"');
    expect(at('href="/shop/casio-watches-kenya"')).toBeLessThan(at('href="/shop/casio-men"'));
    expect(at('href="/shop/casio-women"')).toBeLessThan(at('href="/shop/naviforce-watches-kenya"'));
    const men = html.match(/<a[^>]*href="\/shop\/casio-men"[^>]*>/)?.[0] ?? "";
    expect(men).toMatch(/class="[^"]*\bpl-6\b/);
    expect(html).toMatch(/<ul[^>]*aria-label="Casio"/);
  });

  it("puts the Men and Women list inside Casio's own row, not beside it", () => {
    const row = html.match(/<li><a[^>]*href="\/shop\/casio-watches-kenya"[\s\S]*?<\/ul><\/li>/)?.[0] ?? "";
    expect(row).toContain('href="/shop/casio-men"');
    expect(row).toContain('href="/shop/casio-women"');
    expect(row).not.toContain("naviforce");
  });

  it("gives a brand with no submenu no nested list", () => {
    expect((html.match(/<ul[^>]*aria-label="Casio"/g) ?? []).length).toBe(1);
    expect(html).not.toMatch(/<ul[^>]*aria-label="Naviforce"/);
  });

  it("decorates the Christmas link with a gift box, a candy cane and falling stars, and keeps its words from the store", () => {
    const christmas = html.match(/<a[^>]*href="\/shop\/christmas-gift-packages"[\s\S]*?<\/a>/)?.[0] ?? "";
    expect(christmas).toContain("Christmas");
    expect(christmas).toContain("Gifts</em>");
    expect(christmas).toContain("data-christmas-star");
    expect(christmas).toContain("data-christmas-cane");
    expect(christmas).not.toContain("bg-brand-gold");
    const renamed = renderToStaticMarkup(<CategoryRow menu={{ row: [link("Festive Presents", "christmas-gift-packages", true)] }} />);
    expect(renamed).toContain("Festive ");
    expect(renamed).toContain("Presents</em>");
  });

  it("puts the Christmas link first on a phone, where the row slides and its end is out of sight, and leaves it in its own place from a tablet up", () => {
    const tag = html.match(/<a[^>]*href="\/shop\/christmas-gift-packages"[^>]*>/)?.[0] ?? "";
    const classes = tag.match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
    expect(classes).toContain("max-md:order-first");
    expect(classes.filter((c) => /^(md|lg):order-/.test(c))).toEqual([]);
    const other = html.match(/<a[^>]*href="\/shop\/customizable-gifts"[^>]*>/)?.[0] ?? "";
    expect(other).not.toContain("order-first");
  });

  it("hides every decoration from screen readers, so the link is read as just its name", () => {
    const christmas = html.match(/<a[^>]*href="\/shop\/christmas-gift-packages"[\s\S]*?<\/a>/)?.[0] ?? "";
    const svgs = christmas.match(/<svg[^>]*>/g) ?? [];
    expect(svgs.length).toBeGreaterThan(10);
    const ownRoles = (christmas.match(/<svg[^>]*aria-hidden="true"/g) ?? []).length;
    const starfield = christmas.match(/<span[^>]*aria-hidden="true"[^>]*>(?:<svg[^>]*>[\s\S]*?<\/svg>)+<\/span>/)?.[0] ?? "";
    expect(ownRoles + (starfield.match(/<svg/g) ?? []).length).toBeGreaterThanOrEqual(svgs.length);
    expect(christmas).not.toMatch(/<title|alt=/);
  });

  it("keeps the Christmas link as tall as the other pills to tap, and the gift and cane small with room around the words", () => {
    const css = readFileSync("src/components/ChristmasCategoryLink.module.css", "utf8");
    expect(css).toMatch(/\.link\s*\{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/\.link\s*\{[^}]*padding:\s*7px 1\d+px 3px 2\d+px/);
    expect(css).toMatch(/\.gift\s*\{[^}]*width:\s*(1\d|2\d)px/);
    expect(css).toMatch(/\.cane\s*\{[^}]*width:\s*1\dpx/);
    expect(css).toMatch(/\.link\s*\{[^}]*background:\s*transparent;/);
  });

  it("keeps the stars hidden until the animation starts, so they do not flash on a slow phone, and gives a mouse some feedback on hover", () => {
    const css = readFileSync("src/components/ChristmasCategoryLink.module.css", "utf8");
    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\)\s*\{\s*\.star\s*\{[^}]*opacity:\s*0/);
    expect(css).toMatch(/\.link:hover \.words/);
  });

  it("starts the falling stars on its own, with no hover, and stops them for people who ask for less motion", () => {
    const source = readFileSync("src/components/ChristmasCategoryLink.tsx", "utf8");
    expect(source).toContain("useGSAP");
    expect(source).toContain("prefers-reduced-motion: no-preference");
    expect(source).toContain("media.revert()");
    expect(source).not.toMatch(/onMouse|onPointer|:hover/);
    const motion = source.slice(source.indexOf("useGSAP("), source.indexOf("return ("));
    expect(motion).toMatch(/autoAlpha/);
    expect(motion).not.toMatch(/\b(width|height|top|left|right|bottom)\s*:/);
    expect(readFileSync("src/components/ChristmasCategoryLink.module.css", "utf8")).toContain("prefers-reduced-motion: reduce");
  });

  it("renders nothing when there are no categories", () => {
    expect(renderToStaticMarkup(<CategoryRow menu={{ row: [] }} />)).toBe("");
  });

  it("uses the site font, no main heading, and a fade at the right end of the phone strip in both themes", () => {
    const source = readFileSync("src/components/CategoryRow.tsx", "utf8");
    expect(source).not.toMatch(/fontFamily|Futura/);
    expect(source).not.toMatch(/<h1[\s>]/);
    expect(source).toMatch(/from-white/);
    expect(source).toMatch(/dark:from-\[#0a0a0a\]/i);
    expect(source).toMatch(/dark:via-\[#0a0a0a\]/i);
  });
});
