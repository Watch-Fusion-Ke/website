import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const productList = vi.hoisted(() => vi.fn());
vi.mock("@/components/ProductList", () => ({
  default: (props: Record<string, unknown>) => {
    productList(props);
    return <div data-testid="product-list" />;
  },
}));
const filterProps = vi.hoisted(() => vi.fn());
vi.mock("@/components/Filter", () => ({ default: (p: unknown) => { filterProps(p); return <div data-testid="filter" />; } }));
vi.mock("@/lib/wixClientServer", () => ({
  wixClientServer: async () => ({
    fetchWithAuth: async () => new Response(JSON.stringify({ products: [{ actualPriceRange: { minValue: { amount: "10" } } }, { actualPriceRange: { minValue: { amount: "6450" } } }] }), { status: 200 }),
    collections: {
      queryCollections: () => ({
        find: async () => ({
          items: [
            { _id: "all", name: "All Products", slug: "all-products" },
            { _id: "g", name: "Gent's Watches", slug: "gents-watches" },
            { _id: "l", name: "Ladies Watches", slug: "ladies-watches" },
          ],
        }),
      }),
      getCollectionBySlug: async (slug: string) => ({
        collection: slug === "gents-watches" ? { _id: "g", name: "Gent's Watches" } : undefined,
      }),
    },
  }),
}));

import ShopPage from "@/app/shop/page";

const render = async (params: Record<string, string> = {}) =>
  renderToStaticMarkup(await ShopPage({ searchParams: Promise.resolve(params) }));

describe("Shop page", () => {
  it("builds the category chips from the store's real categories, so none is a dead link", async () => {
    const html = await render();
    expect(html).toContain('href="/shop?cat=gents-watches"');
    expect(html).toContain('href="/shop?cat=ladies-watches"');
    expect(html).not.toContain("couple-sets");
    expect(html).not.toContain("accessories");
  });

  it("starts with one All chip for the whole shop, and does not repeat the store's own All Products category", async () => {
    const html = await render();
    expect(html.match(/>All products</gi) ?? html.match(/>All</g)).not.toBeNull();
    expect(html).not.toContain('href="/shop?cat=all-products"');
  });

  it("marks the chip of the category being viewed", async () => {
    const html = await render({ cat: "gents-watches" });
    const chip = html.match(/<a [^>]*href="\/shop\?cat=gents-watches"[^>]*>/)?.[0] ?? "";
    expect(chip).toContain('aria-current="page"');
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  });

  it("puts the filters above a full-width product grid instead of in a side column", async () => {
    const html = await render();
    expect(html).not.toContain("lg:w-1/4");
    expect(html).not.toContain("lg:w-3/4");
    expect(html.indexOf('data-testid="filter"')).toBeLessThan(html.indexOf('data-testid="product-list"'));
  });

  it("treats the store's own All Products address as the whole shop and highlights the All chip", async () => {
    const html = await render({ cat: "all-products" });
    const all = html.match(/<a [^>]*href="\/shop"[^>]*>/)?.[0] ?? "";
    expect(all).toContain('aria-current="page"');
  });

  it("tells the shopper when the category in the address does not exist", async () => {
    const html = await render({ cat: "no-such-category" });
    expect(html).toMatch(/could not find that category/i);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  });

  it("gives the filter the shop's price range for the slider", async () => {
    await render();
    expect(filterProps).toHaveBeenCalledWith(expect.objectContaining({ bounds: { min: 0, max: 6500 } }));
  });

  it("has one main heading in the title face and no black or pink chips", async () => {
    const html = await render();
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*font-display/);
    expect(html).not.toMatch(/pink|bg-black/);
  });

  it("passes the page's own query on to the product list", async () => {
    await render({ cat: "gents-watches", sort: "asc price" });
    expect(productList).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: "g", searchParams: expect.objectContaining({ sort: "asc price" }) })
    );
  });
});
