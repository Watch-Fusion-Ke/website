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

  it("gives the phone links no box at all: no border, no rounded pill, and no background, which the dark theme would turn into a grey box", () => {
    for (const tag of [html.match(/<a[^>]*href="\/shop\/gents-watches"[^>]*>/)?.[0] ?? "", html.match(/<button[^>]*>/)?.[0] ?? ""]) {
      const classes = tag.match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
      expect(classes).not.toContain("border");
      expect(classes.some((c) => c.startsWith("border-") && !c.startsWith("md:"))).toBe(false);
      expect(classes).not.toContain("rounded-full");
      expect(classes).not.toContain("bg-white");
      expect(classes.some((c) => c.includes("bg-[var(--surface)]"))).toBe(false);
    }
  });

  it("makes the phone pills at least 44 px tall to tap", () => {
    for (const tag of [html.match(/<a[^>]*href="\/shop\/gents-watches"[^>]*>/)?.[0] ?? "", html.match(/<button[^>]*>/)?.[0] ?? ""]) {
      expect(tag).toContain("min-h-11");
    }
  });

  it("sets each phone link as plain 13 px text whose tap area is padding, not a drawn box, so the row is narrower and still 44 px to tap", () => {
    for (const tag of [html.match(/<a[^>]*href="\/shop\/gents-watches"[^>]*>/)?.[0] ?? "", html.match(/<button[^>]*>/)?.[0] ?? ""]) {
      const classes = tag.match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
      expect(classes).toContain("px-3");
      expect(classes).toContain("text-[13px]");
      expect(classes).toContain("min-h-11");
      expect(classes).toContain("max-md:snap-center");
      expect(classes).not.toContain("snap-center");
    }
  });

  it("underlines on hover only for a pointer that really hovers, so a tap on a phone does not leave the last entry stuck underlined", () => {
    for (const tag of [html.match(/<a[^>]*href="\/shop\/gents-watches"[^>]*>/)?.[0] ?? "", html.match(/<button[^>]*>/)?.[0] ?? ""]) {
      const classes = tag.match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
      expect(classes).toContain("[@media(hover:hover)]:hover:underline");
      expect(classes).not.toContain("hover:underline");
      expect(classes).not.toContain("hover:text-black");
    }
  });

  it("draws the keyboard focus ring inside each entry, because the row clips anything outside its 44 px height", () => {
    for (const tag of [html.match(/<a[^>]*href="\/shop\/gents-watches"[^>]*>/)?.[0] ?? "", html.match(/<button[^>]*>/)?.[0] ?? ""]) {
      const classes = tag.match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
      expect(classes).toContain("focus-visible:outline");
      expect(classes).toContain("focus-visible:outline-offset-[-2px]");
    }
    expect(readFileSync("src/components/ChristmasCategoryLink.module.css", "utf8")).toMatch(/\.link:focus-visible\s*\{[^}]*outline-offset:\s*-2px/);
  });

  it("slides the phone row with snapping, with room at both ends, and no extra gap or end padding eating the width", () => {
    const row = html.match(/<div class="([^"]*overflow-x-auto[^"]*)"/)?.[1].split(" ") ?? [];
    expect(row).toContain("max-md:snap-x");
    expect(row).toContain("max-md:snap-proximity");
    expect(row).toContain("scroll-px-4");
    expect(row).toContain("relative"); // the entries' offsets are measured from the row, which is what centring relies on
    expect(row).not.toContain("snap-x");
    expect(row).not.toContain("snap-proximity");
    expect(row).toContain("px-4");
    expect(row).not.toContain("gap-1.5");
    expect(row).not.toContain("pr-8");
  });

  it("sits close under the header on a phone, with a smaller gap above and below than on a computer", () => {
    expect(html).toMatch(/<div class="py-1 md:py-8"/);
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

  it("marks the Christmas link as the entry the phone row opens centred on, and snaps to it", () => {
    const tag = html.match(/<a[^>]*href="\/shop\/christmas-gift-packages"[^>]*>/)?.[0] ?? "";
    const classes = tag.match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
    expect(tag).toContain("data-row-focus");
    expect(classes).toContain("max-md:snap-center");
    expect(html.match(/data-row-focus/g)).toHaveLength(1);
  });

  it("puts the phone row in this order: Watch Brands, Christmas, Customizable Gifts, then the rest, and leaves a computer's order alone", () => {
    const orderOf = (tag: string) => Number(tag.match(/--phone-order:(\d+)/)?.[1]);
    const wb = html.match(/<button[^>]*>/)?.[0] ?? "";
    const xmas = html.match(/<a[^>]*href="\/shop\/christmas-gift-packages"[^>]*>/)?.[0] ?? "";
    const cust = html.match(/<a[^>]*href="\/shop\/customizable-gifts"[^>]*>/)?.[0] ?? "";
    const gents = html.match(/<a[^>]*href="\/shop\/gents-watches"[^>]*>/)?.[0] ?? "";
    expect([orderOf(wb), orderOf(xmas), orderOf(cust), orderOf(gents)]).toEqual([0, 1, 2, 4]);
    // the order is set from a phone's width only, so nothing about the page's own order or a computer's changes
    for (const tag of [wb, xmas, cust, gents]) {
      const classes = tag.match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
      expect(classes).toContain("max-md:[order:var(--phone-order)]");
      expect(classes.some((c) => /^(md|lg|xl):.*order/.test(c))).toBe(false);
    }
    // in the page itself, Customizable Gifts still comes before Christmas, as the computer shows them
    expect(html.indexOf('href="/shop/customizable-gifts"')).toBeLessThan(html.indexOf('href="/shop/christmas-gift-packages"'));
  });

  it("opens the phone row centred on the marked entry, so the row starts balanced like the computer's", () => {
    const source = readFileSync("src/components/CategoryRow.tsx", "utf8");
    expect(source).toContain("[data-row-focus]");
    expect(source).toContain("centreScrollLeft");
    expect(source).toContain("useLayoutEffect"); // before the first paint, so there is no second jump
  });

  it("centres the row on a tablet or computer without ever pushing its first entry out of reach when the row is too wide", () => {
    // The page's HTML writes & and > as &amp; and &gt; inside the class names; the browser reads them back.
    const row = (html.match(/<div class="([^"]*overflow-x-auto[^"]*)"/)?.[1] ?? "").replace(/&amp;/g, "&").replace(/&gt;/g, ">").split(" ");
    // Auto margins at the two ends centre a row that fits and shrink to nothing when it does not, so the start stays reachable.
    expect(row).toContain("md:[&>:first-child]:ml-auto");
    expect(row).toContain("md:[&>:last-child]:mr-auto");
    expect(row).not.toContain("md:justify-center");
  });

  it("steps the larger text and the gaps up with the screen, so the row fits a tablet and keeps its roomy look on a wide screen", () => {
    const row = html.match(/<div class="([^"]*overflow-x-auto[^"]*)"/)?.[1].split(" ") ?? [];
    expect(row).toEqual(expect.arrayContaining(["md:gap-6", "lg:gap-8", "xl:gap-16"]));
    const tag = html.match(/<a[^>]*href="\/shop\/gents-watches"[^>]*>/)?.[0] ?? "";
    const classes = tag.match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
    expect(classes).toContain("md:text-lg");
    expect(classes).toContain("lg:text-xl");
    expect(classes).not.toContain("md:text-xl");
    const css = readFileSync("src/components/ChristmasCategoryLink.module.css", "utf8");
    expect(css).toMatch(/@media \(min-width: 1024px\)\s*\{\s*\.link\s*\{[^}]*font-size:\s*19px/);
  });

  it("centres the phone row again, and recounts which ends fade, when the screen turns or is resized", () => {
    expect(readFileSync("src/components/CategoryRow.tsx", "utf8")).toContain("ResizeObserver");
  });

  it("counts the empty padding of the row and its entries as not hiding anything, so a fade never washes out a word that is on screen", () => {
    const source = readFileSync("src/components/CategoryRow.tsx", "utf8");
    expect(source).toMatch(/EDGE_SLACK\s*=\s*28/);
    expect(source).toMatch(/scrollEdges\([^)]*EDGE_SLACK\)/);
  });

  it("scrolls an entry fully into view when the keyboard focuses it, instead of leaving it half under a fade", () => {
    const source = readFileSync("src/components/CategoryRow.tsx", "utf8");
    expect(source).toContain("scrollIntoView");
    expect(source).toContain(":focus-visible");
  });

  it("shuts an open menu when the row is scrolled, so its box never hangs where its button used to be", () => {
    const source = readFileSync("src/components/CategoryRow.tsx", "utf8");
    expect(source.slice(source.indexOf("const onRowScroll"))).toMatch(/setState\(closed\)/);
  });

  it("sets the Christmas link in the same 13 px text as the other phone entries", () => {
    expect(readFileSync("src/components/ChristmasCategoryLink.module.css", "utf8")).toMatch(/\.link\s*\{[^}]*font-size:\s*13px/);
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

  it("fades only the end of the phone row that has more beyond it: the right at the start, the left once scrolled", () => {
    expect(html).toContain("bg-gradient-to-l");
    expect(html).not.toContain("bg-gradient-to-r");
    // Hidden only from a laptop up, where the row fits: a tablet's row can still overflow and needs the hint.
    expect(html.match(/<div class="([^"]*bg-gradient-to-l[^"]*)"/)?.[1].split(" ")).toContain("lg:hidden");
    expect(html.match(/<div class="([^"]*bg-gradient-to-l[^"]*)"/)?.[1].split(" ")).not.toContain("md:hidden");
    expect(readFileSync("src/components/CategoryRow.tsx", "utf8")).toContain("bg-gradient-to-r");
  });

  it("uses the site font, no main heading, and fades in both themes", () => {
    const source = readFileSync("src/components/CategoryRow.tsx", "utf8");
    expect(source).not.toMatch(/fontFamily|Futura/);
    expect(source).not.toMatch(/<h1[\s>]/);
    expect(source).toMatch(/from-white/);
    expect(source).toMatch(/dark:from-\[#0a0a0a\]/i);
    expect(source).toMatch(/dark:via-\[#0a0a0a\]/i);
  });
});
