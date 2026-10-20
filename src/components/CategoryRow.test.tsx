import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import CategoryRow from "@/components/CategoryRow";
import type { SiteMenu } from "@/lib/siteMenu";

const menu: SiteMenu = {
  primary: [{ name: "Gent's Watches", slug: "gents-watches" }, { name: "Ladies Watches", slug: "ladies-watches" }],
  groups: [
    { label: "Brands", items: [{ name: "Casio", slug: "casio-watches-kenya" }, { name: "Naviforce", slug: "naviforce-watches-kenya" }] },
    { label: "Gifts", items: [{ name: "Corporate Gifts", slug: "corporate-gifts" }, { name: "Customizable Gifts", slug: "customizable-gifts" }] },
  ],
  seasonal: [{ name: "Valentine's Gifts", slug: "valentines-gifts" }],
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

  it("shows a seasonal page as a gold highlighted link", () => {
    const link = html.match(/<a[^>]*href="\/shop\?cat=valentines-gifts"[^>]*>/)?.[0] ?? "";
    expect(link).toContain("bg-brand-gold");
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
    expect(html).toMatch(/<ul[^>]*aria-label="Brands"/);
    expect(html).toMatch(/<ul[^>]*aria-label="Gifts"/);
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
    expect(renderToStaticMarkup(<CategoryRow menu={{ primary: [], groups: [], seasonal: [] }} />)).toBe("");
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
