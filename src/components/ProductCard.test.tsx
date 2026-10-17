import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProductCardView from "@/components/ProductCard";
import type { ProductCard } from "@/lib/storeProducts";

const card = (extra: Partial<ProductCard> = {}): ProductCard => ({
  id: "1",
  slug: "naviforce-nf9269",
  name: "Naviforce NF9269 Men's Silver Dial Blue Leather Watch",
  imageUrl: "https://img/a.jpg",
  hoverImageUrl: "https://img/b.jpg",
  priceLabel: "KES 3,500",
  compareAtLabel: null,
  discountPercent: null,
  ...extra,
});

const render = (c: ProductCard) => renderToStaticMarkup(<ProductCardView product={c} />);

describe("ProductCardView", () => {
  it("links the whole card to the product page", () => {
    expect(render(card())).toContain('href="/naviforce-nf9269"');
  });

  it("shows the name over at most two lines and the price on a line of its own", () => {
    const html = render(card());
    const nameTag = html.match(/<h3[^>]*>/)?.[0] ?? "";
    expect(nameTag).toContain("line-clamp-2");
    const priceTag = html.match(/<p[^>]*data-price[^>]*>/)?.[0] ?? "";
    expect(priceTag).not.toBe("");
    expect(html.indexOf("<h3")).toBeLessThan(html.indexOf("data-price"));
  });

  it("shows no sale marks on a product that is not on sale", () => {
    const html = render(card());
    expect(html).not.toContain("line-through");
    expect(html).not.toContain("Sale");
  });

  it("shows the old price struck through, the new price, and the percent off when on sale", () => {
    const html = render(card({ compareAtLabel: "KES 4,375", discountPercent: 20 }));
    expect(html).toMatch(/<s[^>]*>KES 4,375<\/s>/);
    expect(html).toContain("KES 3,500");
    expect(html).toContain("Sale 20% off");
  });

  it("tells screen reader users what the struck-through price means", () => {
    const html = render(card({ compareAtLabel: "KES 4,375", discountPercent: 20 }));
    expect(html).toContain("Was KES 4,375");
    expect(html).toContain("Now KES 3,500");
  });

  it("has one full-width navy button, drawn as text so it is not a button inside a link", () => {
    const html = render(card());
    expect(html).not.toContain("<button");
    expect(html).toContain("Add to cart");
    expect(html).toContain("bg-brand-navy");
    expect(html).toContain("w-full");
  });

  it("uses no pink", () => {
    expect(render(card({ compareAtLabel: "KES 4,375", discountPercent: 20 }))).not.toMatch(/pink|rose|red-/);
  });

  it("shows the second photo on hover only when there is one", () => {
    const second = encodeURIComponent("https://img/b.jpg");
    expect(render(card())).toContain(second);
    expect(render(card({ hoverImageUrl: null }))).not.toContain(second);
  });
});
