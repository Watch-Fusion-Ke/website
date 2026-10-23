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
const categoriesList = [
  { id: "all", name: "All Products", slug: "all-products", description: "" },
  { id: "g", name: "Gent's Watches", slug: "gents-watches", description: "" },
  { id: "l", name: "Ladies Watches", slug: "ladies-watches", description: "" },
];
vi.mock("@/lib/wixClientServer", () => ({
  wixClientServer: async () => ({
    fetchWithAuth: async (url: string) =>
      url.includes("/categories/")
        ? new Response(JSON.stringify({ categories: categoriesList }), { status: 200 })
        : new Response(JSON.stringify({ products: [{ actualPriceRange: { minValue: { amount: "10" } } }, { actualPriceRange: { minValue: { amount: "6450" } } }] }), { status: 200 }),
  }),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  permanentRedirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  },
}));

import ShopPage, { generateMetadata } from "@/app/shop/page";

const render = async (params: Record<string, string> = {}) =>
  renderToStaticMarkup(await ShopPage({ searchParams: Promise.resolve(params) }));

describe("Shop page search", () => {
  it("says what was searched for, instead of calling the page 'Shop all products'", async () => {
    const html = await render({ name: "Naviforce" });
    expect(html).toContain("Results for");
    expect(html).toContain("Naviforce");
    expect(html).not.toContain("Shop all products");
  });

  it("does not mark any category pill as the page being viewed while a search is shown", async () => {
    const html = await render({ name: "Naviforce" });
    expect(html).not.toContain('aria-current="page"');
  });

  it("keeps the usual title and the All products pill when nothing is searched", async () => {
    const html = await render({});
    expect(html).toContain("Shop all products");
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  });
});

describe("Shop page", () => {
  it("builds the category chips from the store's real categories, so none is a dead link", async () => {
    const html = await render();
    expect(html).toContain('href="/shop/gents-watches"');
    expect(html).toContain('href="/shop/ladies-watches"');
    expect(html).not.toContain("couple-sets");
    expect(html).not.toContain("accessories");
  });

  it("starts with one All chip for the whole shop, and does not repeat the store's own All Products category", async () => {
    const html = await render();
    expect(html.match(/>All products</gi) ?? html.match(/>All</g)).not.toBeNull();
    expect(html).not.toContain('href="/shop/all-products"');
  });

  it("puts the filters above a full-width product grid instead of in a side column", async () => {
    const html = await render();
    expect(html).not.toContain("lg:w-1/4");
    expect(html).not.toContain("lg:w-3/4");
    expect(html.indexOf('data-testid="filter"')).toBeLessThan(html.indexOf('data-testid="product-list"'));
  });

  it("sends the old ?cat= address to the category's own page for good, keeping the other options", async () => {
    await expect(render({ cat: "gents-watches" })).rejects.toThrow("NEXT_REDIRECT /shop/gents-watches");
    await expect(render({ cat: "gents-watches", sort: "asc price" })).rejects.toThrow("NEXT_REDIRECT /shop/gents-watches?sort=asc+price");
  });

  it("sends the store's own All Products address to the plain shop", async () => {
    await expect(render({ cat: "all-products" })).rejects.toThrow("NEXT_REDIRECT /shop");
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
    await render({ sort: "asc price" });
    expect(productList).toHaveBeenCalledWith(expect.objectContaining({ categoryId: "", searchParams: expect.objectContaining({ sort: "asc price" }) }));
  });
});

describe("Shop page metadata", () => {
  const meta = (params: Record<string, string> = {}) => generateMetadata({ searchParams: Promise.resolve(params) });

  it("is the shop's own title, description and address", async () => {
    const m = await meta();
    expect(m.title).toBe("Shop watches");
    expect(String(m.description).length).toBeGreaterThan(40);
    expect(m.alternates?.canonical).toBe("/shop");
  });

  it("asks search engines to leave out a page that shows a search or filters", async () => {
    expect((await meta({ name: "casio" })).robots).toMatchObject({ index: false });
    expect((await meta({ sort: "asc price" })).robots).toMatchObject({ index: false });
    expect((await meta()).robots).toBeUndefined();
  });
});
