import { describe, expect, it } from "vitest";
import {
  PRODUCTS_SEARCH_URL,
  buildSearchBody,
  listProducts,
  type FetchLike,
} from "@/lib/storeProducts";

const CATEGORY = "e13a1031-1747-bffd-b847-56c1ee9a1b07";

const wixProduct = (n: number, overrides: Record<string, unknown> = {}) => ({
  id: `id-${n}`,
  slug: `watch-${n}`,
  name: `Watch ${n}`,
  actualPriceRange: {
    minValue: { amount: "3500.00" },
    maxValue: { amount: "3500.00" },
  },
  media: {
    main: { image: { url: `https://img/${n}-a.jpg` } },
    itemsInfo: {
      items: [
        { image: { url: `https://img/${n}-a.jpg` } },
        { image: { url: `https://img/${n}-b.jpg` } },
      ],
    },
  },
  ...overrides,
});

const fakeFetch = (products: unknown[], status = 200, body?: unknown) => {
  const calls: { url: string; body: any }[] = [];
  const fetchLike: FetchLike = async (url, init) => {
    calls.push({ url, body: JSON.parse(String(init?.body)) });
    return new Response(JSON.stringify(body ?? { products }), { status });
  };
  return { fetchLike, calls };
};

describe("buildSearchBody", () => {
  it("asks Wix for each product's full photo list, which the hover photo on a card needs", () => {
    expect(buildSearchBody({}).fields).toContain("MEDIA_ITEMS_INFO");
  });

  it("sends no filter when nothing is asked for", () => {
    const body = buildSearchBody({});
    expect(body.search.filter).toBeUndefined();
    expect(body.search.cursorPaging).toEqual({ limit: 100 });
  });

  it("filters by category through the category membership field", () => {
    const { filter } = buildSearchBody({ categoryId: CATEGORY }).search;
    expect(filter).toEqual({
      $and: [
        {
          "allCategoriesInfo.categories": {
            $matchItems: [{ id: { $eq: CATEGORY } }],
          },
        },
      ],
    });
  });

  it("ignores an empty category id so the home page's unset category shows every product", () => {
    expect(buildSearchBody({ categoryId: "" }).search.filter).toBeUndefined();
  });

  it("never uses the two catalog V1 fields that Wix rejects on a V3 store", () => {
    const text = JSON.stringify(
      buildSearchBody({ categoryId: CATEGORY, type: "physical", name: "n" })
    );
    expect(text).not.toContain("collectionIds");
    expect(text).not.toContain("$hasSome");
  });

  it("puts each price bound in its own condition", () => {
    const { filter } = buildSearchBody({ min: "1000", max: "9000" }).search;
    expect(filter?.$and).toEqual([
      { "actualPriceRange.minValue.amount": { $gte: "1000" } },
      { "actualPriceRange.minValue.amount": { $lte: "9000" } },
    ]);
  });

  it("maps name and product type", () => {
    const { filter } = buildSearchBody({ name: "Navi", type: "digital" }).search;
    expect(filter?.$and).toContainEqual({ name: { $startsWith: "Navi" } });
    expect(filter?.$and).toContainEqual({ productType: { $eq: "DIGITAL" } });
  });

  it("maps the sort choices the filter form offers", () => {
    expect(buildSearchBody({ sort: "asc price" }).search.sort).toEqual([
      { fieldName: "actualPriceRange.minValue.amount", order: "ASC" },
    ]);
    expect(buildSearchBody({ sort: "desc lastUpdated" }).search.sort).toEqual([
      { fieldName: "updatedDate", order: "DESC" },
    ]);
  });

  it("ignores values that only exist on every object, such as 'constructor'", () => {
    expect(buildSearchBody({ type: "constructor" }).search.filter).toBeUndefined();
    expect(buildSearchBody({ type: "__proto__" }).search.filter).toBeUndefined();
    expect(buildSearchBody({ sort: "asc constructor" }).search.sort).toBeUndefined();
    expect(buildSearchBody({ sort: "asc __proto__" }).search.sort).toBeUndefined();
  });

  it("uses the first value when a query key is repeated", () => {
    const { filter } = buildSearchBody({
      name: ["Navi", "Curren"],
      type: ["physical", "digital"],
      min: ["1000", "2000"],
    }).search;
    expect(filter?.$and).toContainEqual({ name: { $startsWith: "Navi" } });
    expect(filter?.$and).toContainEqual({ productType: { $eq: "PHYSICAL" } });
    expect(filter?.$and).toContainEqual({ "actualPriceRange.minValue.amount": { $gte: "1000" } });
    expect(buildSearchBody({ sort: ["asc price", "desc name"] }).search.sort).toHaveLength(1);
  });

  it("reads a price typed with a thousands comma and drops one that is not a number", () => {
    expect(buildSearchBody({ min: "1,000" }).search.filter?.$and).toEqual([
      { "actualPriceRange.minValue.amount": { $gte: "1000" } },
    ]);
    expect(buildSearchBody({ min: "KES 500", max: "abc" }).search.filter).toBeUndefined();
  });

  it("drops a sort it does not know instead of sending it to Wix", () => {
    expect(buildSearchBody({ sort: "asc colour" }).search.sort).toBeUndefined();
    expect(buildSearchBody({ sort: "sideways price" }).search.sort).toBeUndefined();
  });
});

describe("listProducts", () => {
  it("posts one search to the V3 products endpoint", async () => {
    const { fetchLike, calls } = fakeFetch([wixProduct(1)]);
    await listProducts(fetchLike, { categoryId: CATEGORY });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(PRODUCTS_SEARCH_URL);
    expect(PRODUCTS_SEARCH_URL).toBe("https://www.wixapis.com/stores/v3/products/search");
  });

  it("turns a Wix product into a card", async () => {
    const { fetchLike } = fakeFetch([wixProduct(1)]);
    const page = await listProducts(fetchLike, {});
    expect(page.items[0]).toEqual({
      id: "id-1",
      slug: "watch-1",
      name: "Watch 1",
      imageUrl: "https://img/1-a.jpg",
      hoverImageUrl: "https://img/1-b.jpg",
      priceLabel: "KES 3,500",
    });
  });

  it("prefixes 'From' when variants have different prices", async () => {
    const product = wixProduct(1, {
      actualPriceRange: {
        minValue: { amount: "2500.00" },
        maxValue: { amount: "4000.00" },
      },
    });
    const page = await listProducts(fakeFetch([product]).fetchLike, {});
    expect(page.items[0].priceLabel).toBe("From KES 2,500");
  });

  it("falls back when a product has no images or no price", async () => {
    const bare = { id: "x", slug: "bare", name: "Bare" };
    const page = await listProducts(fakeFetch([bare]).fetchLike, {});
    expect(page.items[0]).toMatchObject({
      imageUrl: null,
      hoverImageUrl: null,
      priceLabel: "",
    });
  });

  it("returns an empty page for an empty category", async () => {
    const page = await listProducts(fakeFetch([]).fetchLike, { categoryId: CATEGORY });
    expect(page).toEqual({ items: [], page: 0, hasPrev: false, hasNext: false });
  });

  it("pages in memory, zero based, and reports both directions", async () => {
    const products = Array.from({ length: 25 }, (_, i) => wixProduct(i));
    const { fetchLike } = fakeFetch(products);

    const first = await listProducts(fetchLike, { limit: 9 });
    expect(first.items.map((i) => i.id)).toEqual(products.slice(0, 9).map((p) => p.id));
    expect(first).toMatchObject({ page: 0, hasPrev: false, hasNext: true });

    const second = await listProducts(fetchLike, { limit: 9, page: "1" });
    expect(second.items[0].id).toBe("id-9");
    expect(second).toMatchObject({ page: 1, hasPrev: true, hasNext: true });

    const last = await listProducts(fetchLike, { limit: 9, page: "2" });
    expect(last.items).toHaveLength(7);
    expect(last).toMatchObject({ page: 2, hasPrev: true, hasNext: false });
  });

  it("treats a junk page number as the first page", async () => {
    const page = await listProducts(fakeFetch([wixProduct(1)]).fetchLike, { page: "abc" });
    expect(page.page).toBe(0);
  });

  it("treats a repeated page key as its first value", async () => {
    const products = Array.from({ length: 12 }, (_, i) => wixProduct(i));
    const page = await listProducts(fakeFetch(products).fetchLike, { limit: 5, page: ["1", "2"] });
    expect(page.page).toBe(1);
    expect(page.items[0].id).toBe("id-5");
  });

  it("returns an empty last page when the page is past the end", async () => {
    const page = await listProducts(fakeFetch([wixProduct(1)]).fetchLike, { limit: 5, page: "4" });
    expect(page).toEqual({ items: [], page: 4, hasPrev: true, hasNext: false });
  });

  it("throws when a 200 response has no product list", async () => {
    const { fetchLike } = fakeFetch([], 200, { unexpected: true });
    await expect(listProducts(fetchLike, {})).rejects.toThrow(/unexpected response/);
  });

  it("throws with Wix's message when the search is rejected", async () => {
    const { fetchLike } = fakeFetch([], 400, {
      message: "Invalid filter",
      details: { applicationError: { code: "SE-1105" } },
    });
    await expect(listProducts(fetchLike, {})).rejects.toThrow(/400.*SE-1105.*Invalid filter/);
  });
});
