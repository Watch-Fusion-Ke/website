import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CategoryChips from "@/components/CategoryChips";

const chips = [
  { name: "Ladies Watches", slug: "ladies-watches" },
  { name: "Gent's Watches", slug: "gents-watches" },
];
const html = (activeSlug: string) => renderToStaticMarkup(<CategoryChips chips={chips} activeSlug={activeSlug} />);

describe("CategoryChips", () => {
  it("starts with All products, then one pill for each category, as links to the shop", () => {
    const out = html("");
    expect(out.indexOf(">All products<")).toBeLessThan(out.indexOf(">Ladies Watches<"));
    expect(out).toContain('href="/shop"');
    expect(out).toContain('href="/shop?cat=ladies-watches"');
    expect(out).toContain('href="/shop?cat=gents-watches"');
  });

  it("marks exactly one pill as the page being viewed", () => {
    expect(html("gents-watches").match(/aria-current="page"/g)).toHaveLength(1);
    expect(html("").match(/aria-current="page"/g)).toHaveLength(1);
    const tag = html("gents-watches").match(/<a [^>]*href="\/shop\?cat=gents-watches"[^>]*>/)?.[0] ?? "";
    expect(tag).toContain('aria-current="page"');
  });

  it("is a labelled navigation that scrolls sideways on a phone and wraps on large screens", () => {
    const nav = html("").match(/<nav [^>]*>/)?.[0] ?? "";
    expect(nav).toContain('aria-label="Categories"');
    expect(nav).toContain("overflow-x-auto");
    expect(nav).toContain("md:flex-wrap");
  });

  it("uses the shop's navy and gold, with no black or pink", () => {
    const out = html("gents-watches");
    expect(out).not.toMatch(/bg-black|pink|rose|fuchsia/);
    expect(out).toContain("bg-brand-navy");
  });
});
