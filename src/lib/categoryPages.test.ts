import { describe, expect, it } from "vitest";
import {
  CATEGORIES_QUERY_URL,
  categoryDescription,
  categoryHref,
  categoryTitle,
  findCategory,
  hasFilters,
  legacyCategoryTarget,
  loadCategoryPages,
  type CategoryPage,
} from "@/lib/categoryPages";

const wix = (over: Record<string, unknown> = {}) => ({ id: "c1", name: "Casio", slug: "casio-watches-kenya", description: "", ...over });
const seo = (title?: string, description?: string, extra: object[] = []) => ({
  seoData: {
    tags: [
      ...(title ? [{ type: "title", children: title, custom: false, disabled: false }] : []),
      ...(description ? [{ type: "meta", props: { name: "description", content: description }, children: "", custom: false, disabled: false }] : []),
      ...extra,
    ],
  },
});
const fetchOf = (categories: unknown[], status = 200) => {
  const calls: { url: string; body: unknown }[] = [];
  const fetchLike = async (url: string, init?: RequestInit) => {
    calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(JSON.stringify({ categories }), { status });
  };
  return { fetchLike, calls };
};

describe("the address of a category", () => {
  it("is /shop/<slug>, one page of its own with no question mark", () => {
    expect(categoryHref("gift-packages")).toBe("/shop/gift-packages");
    expect(categoryHref("casio-watches-kenya")).toBe("/shop/casio-watches-kenya");
  });

  it("is the plain shop for the store's own All Products category", () => {
    expect(categoryHref("all-products")).toBe("/shop");
  });
});

describe("loading the categories", () => {
  it("asks the store's category tree for the visible categories and keeps what a page needs", async () => {
    const { fetchLike, calls } = fetchOf([wix({ description: "Casio watches." }), wix({ id: "c2", name: "Curren", slug: "curren-watches-kenya" })]);
    const list = await loadCategoryPages(fetchLike);
    expect(calls[0].url).toBe(CATEGORIES_QUERY_URL);
    expect(calls[0].body).toMatchObject({ treeReference: { appNamespace: "@wix/stores", treeKey: null } });
    expect(JSON.stringify(calls[0].body)).not.toContain("returnNonVisibleCategories\":true");
    expect(list.map((c) => c.slug)).toEqual(["casio-watches-kenya", "curren-watches-kenya"]);
    expect(list[0]).toMatchObject({ id: "c1", name: "Casio", description: "Casio watches." });
  });

  it("reads the SEO title and description the shop wrote in the store", async () => {
    const { fetchLike } = fetchOf([wix(seo("Casio Watches Kenya | Men's & Ladies'", "Shop Casio in Kenya."))]);
    const [casio] = await loadCategoryPages(fetchLike);
    expect(casio.seoTitle).toBe("Casio Watches Kenya | Men's & Ladies'");
    expect(casio.seoDescription).toBe("Shop Casio in Kenya.");
  });

  it("ignores a disabled SEO tag and a category with no SEO data", async () => {
    const { fetchLike } = fetchOf([
      wix({ seoData: { tags: [{ type: "title", children: "Hidden title", disabled: true }] } }),
      wix({ id: "c2", slug: "b", name: "B" }),
    ]);
    const list = await loadCategoryPages(fetchLike);
    expect(list[0].seoTitle).toBeNull();
    expect(list[1].seoTitle).toBeNull();
    expect(list[1].seoDescription).toBeNull();
  });

  it("drops a category with no name, slug or id, so no page can be built without them", async () => {
    const { fetchLike } = fetchOf([wix({ slug: "" }), wix({ id: "" }), wix({ name: "" }), wix({ id: "ok", slug: "ok", name: "Ok" })]);
    expect((await loadCategoryPages(fetchLike)).map((c) => c.slug)).toEqual(["ok"]);
  });

  it("fails loudly when the store cannot be read, so a page does not pretend a category is missing", async () => {
    await expect(loadCategoryPages(fetchOf([], 500).fetchLike)).rejects.toThrow(/categor/i);
    const nonsense = async () => new Response("{}", { status: 200 });
    await expect(loadCategoryPages(nonsense)).rejects.toThrow(/categor/i);
  });
});

describe("a category page's title and description", () => {
  const base: CategoryPage = { id: "c1", name: "Gift Packages", slug: "gift-packages", description: "", seoTitle: null, seoDescription: null };

  it("takes the title the shop wrote for search engines, or else the category's name", () => {
    expect(categoryTitle({ ...base, seoTitle: "Gift Packages in Nairobi | Watch Fusion Kenya" })).toEqual({ absolute: "Gift Packages in Nairobi | Watch Fusion Kenya" });
    expect(categoryTitle(base)).toBe("Gift Packages");
  });

  it("takes the description the shop wrote for search engines, then the category's own description, then a plain one", () => {
    expect(categoryDescription({ ...base, seoDescription: "SEO text.", description: "Own text." })).toBe("SEO text.");
    expect(categoryDescription({ ...base, description: "Own text." })).toBe("Own text.");
    expect(categoryDescription(base)).toMatch(/Gift Packages/);
    expect(categoryDescription(base)).toMatch(/Watch Fusion Kenya/);
    expect(categoryDescription(base).length).toBeGreaterThan(40);
  });

  it("finds a category by its slug and by nothing else", () => {
    const list = [base, { ...base, id: "c2", slug: "other", name: "Other" }];
    expect(findCategory(list, "other")?.id).toBe("c2");
    expect(findCategory(list, "missing")).toBeUndefined();
    expect(findCategory(list, "")).toBeUndefined();
  });
});

describe("the old ?cat= address", () => {
  it("goes to the category's own address", () => {
    expect(legacyCategoryTarget({ cat: "gents-watches" })).toBe("/shop/gents-watches");
  });

  it("keeps every other option the shopper had", () => {
    expect(legacyCategoryTarget({ cat: "gents-watches", sort: "asc price", min: "1000", page: "2" })).toBe(
      "/shop/gents-watches?sort=asc+price&min=1000&page=2"
    );
  });

  it("sends the store's All Products category to the plain shop, keeping the options", () => {
    expect(legacyCategoryTarget({ cat: "all-products" })).toBe("/shop");
    expect(legacyCategoryTarget({ cat: "all-products", name: "casio" })).toBe("/shop?name=casio");
  });

  it("is nothing at all when there is no cat option, so the plain shop is left alone", () => {
    expect(legacyCategoryTarget({})).toBeNull();
    expect(legacyCategoryTarget({ name: "casio" })).toBeNull();
  });

  it("takes the first of a repeated option, and an empty one means the plain shop", () => {
    expect(legacyCategoryTarget({ cat: ["a", "b"] })).toBe("/shop/a");
    expect(legacyCategoryTarget({ cat: "" })).toBe("/shop");
    expect(legacyCategoryTarget({ cat: "", name: "x" })).toBe("/shop?name=x");
  });

  it("can only ever lead to a page inside the shop: a slash, dots or an address in the option are encoded, not followed", () => {
    expect(legacyCategoryTarget({ cat: "../admin" })).toBe("/shop/..%2Fadmin");
    expect(legacyCategoryTarget({ cat: "https://evil.example" })).toBe("/shop/https%3A%2F%2Fevil.example");
    expect(legacyCategoryTarget({ cat: "//evil.example" })?.startsWith("/shop/")).toBe(true);
  });

  it("gives up on an absurdly long option instead of building an address from it", () => {
    expect(legacyCategoryTarget({ cat: "a".repeat(300) })).toBe("/shop");
  });
});

describe("a page with filters or a search", () => {
  it("is one that search engines should not list, so the plain category page is the one that ranks", () => {
    expect(hasFilters({ name: "casio" })).toBe(true);
    expect(hasFilters({ sort: "asc price" })).toBe(true);
    expect(hasFilters({ min: "1000" })).toBe(true);
    expect(hasFilters({ max: "9000" })).toBe(true);
    expect(hasFilters({ type: "physical" })).toBe(true);
  });

  it("is not a plain page number, or an empty option", () => {
    expect(hasFilters({})).toBe(false);
    expect(hasFilters({ page: "2" })).toBe(false);
    expect(hasFilters({ name: "" })).toBe(false);
  });
});
