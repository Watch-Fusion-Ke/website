import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const productList = vi.hoisted(() => vi.fn());
vi.mock("@/components/ProductList", () => ({
  default: (props: Record<string, unknown>) => {
    productList(props);
    return <div data-testid="product-list" />;
  },
}));
vi.mock("@/components/Filter", () => ({ default: () => <div data-testid="filter" /> }));

const store = vi.hoisted(() => ({ fail: false }));
const categoriesList = [
  { id: "all", name: "All Products", slug: "all-products", description: "" },
  { id: "g", name: "Gent's Watches", slug: "gents-watches", description: "Watches for men." },
  {
    id: "c",
    name: "Casio",
    slug: "casio-watches-kenya",
    description: "",
    seoData: {
      tags: [
        { type: "title", children: "Casio Watches Kenya | Men's & Ladies' Casio Watches | WatchFusionKe", disabled: false },
        { type: "meta", props: { name: "description", content: "Shop Casio watches in Kenya at Watch Fusion Kenya." }, disabled: false },
      ],
    },
  },
  { id: "p", name: "Gift Packages", slug: "gift-packages", description: "" },
];
vi.mock("@/lib/wixClientServer", () => ({
  wixClientServer: async () => ({
    fetchWithAuth: async (url: string, init?: RequestInit) => {
      if (store.fail && url.includes("/categories/")) return new Response("{}", { status: 500 });
      // Like the store, a category's description is sent only when the request asks for it.
      const asked = String(init?.body ?? "").includes("DESCRIPTION");
      return url.includes("/categories/")
        ? new Response(JSON.stringify({ categories: categoriesList.map((c) => (asked ? c : { ...c, description: undefined })) }), { status: 200 })
        : new Response(JSON.stringify({ products: [{ actualPriceRange: { minValue: { amount: "10" } } }, { actualPriceRange: { minValue: { amount: "6450" } } }] }), { status: 200 });
    },
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

import CategoryPage, { generateMetadata } from "@/app/shop/[category]/page";

const props = (category: string, params: Record<string, string> = {}) => ({ params: Promise.resolve({ category }), searchParams: Promise.resolve(params) });
const render = async (category: string, params: Record<string, string> = {}) => renderToStaticMarkup(await CategoryPage(props(category, params)));

describe("a category page", () => {
  it("is headed by the category's name and shows its description", async () => {
    const html = await render("gents-watches");
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>Gent(?:&#x27;|')s Watches<\/h1>/);
    expect(html).toContain("Watches for men.");
  });

  it("lists that category's products, with the filters above them", async () => {
    productList.mockClear();
    const html = await render("gents-watches", { sort: "asc price" });
    expect(productList).toHaveBeenCalledWith(expect.objectContaining({ categoryId: "g", searchParams: expect.objectContaining({ sort: "asc price" }) }));
    expect(html.indexOf('data-testid="filter"')).toBeLessThan(html.indexOf('data-testid="product-list"'));
  });

  it("marks its own pill as the page being viewed, and links every pill to a page of its own", async () => {
    const html = await render("gift-packages");
    const pill = html.match(/<a [^>]*href="\/shop\/gift-packages"[^>]*>/)?.[0] ?? "";
    expect(pill).toContain('aria-current="page"');
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toContain('href="/shop/casio-watches-kenya"');
    expect(html).not.toContain("?cat=");
    expect(html).not.toContain('href="/shop/all-products"');
  });

  it("is not found when the store has no such category, so a made-up address gives a real 404", async () => {
    await expect(render("no-such-category")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("sends the store's own All Products category to the plain shop", async () => {
    await expect(render("all-products")).rejects.toThrow("NEXT_REDIRECT /shop");
  });

  it("does not claim a category is missing when the store simply cannot be read", async () => {
    store.fail = true;
    try {
      await expect(render("gents-watches")).rejects.not.toThrow("NEXT_NOT_FOUND");
      await expect(render("gents-watches")).rejects.toThrow();
    } finally {
      store.fail = false;
    }
  });
});

describe("a category page's trail", () => {
  const trail = (html: string) => {
    const raw = html.match(/<script type="application\/ld\+json">([^<]*)<\/script>/)?.[1] ?? "";
    return JSON.parse(raw.replace(/&quot;/g, '"'));
  };

  it("says where it is: Home, Shop, then the category, for search engines", async () => {
    const ld = trail(await render("gift-packages"));
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement.map((i: { name: string }) => i.name)).toEqual(["Home", "Shop", "Gift Packages"]);
    expect(ld.itemListElement[2].item).toBe("https://www.watchfusionkenya.com/shop/gift-packages");
  });
});

describe("a category page's metadata", () => {
  const meta = (category: string, params: Record<string, string> = {}) => generateMetadata(props(category, params));

  it("uses the title and description the shop wrote for it in the store", async () => {
    const m = await meta("casio-watches-kenya");
    expect(m.title).toEqual({ absolute: "Casio Watches Kenya | Men's & Ladies' Casio Watches | WatchFusionKe" });
    expect(m.description).toBe("Shop Casio watches in Kenya at Watch Fusion Kenya.");
  });

  it("falls back to the category's name and a plain description when the shop wrote none", async () => {
    const m = await meta("gift-packages");
    expect(m.title).toBe("Gift Packages");
    expect(String(m.description)).toMatch(/Gift Packages/);
  });

  it("has one address of its own, the same in the page's tags and in link previews", async () => {
    const m = await meta("gift-packages");
    expect(m.alternates?.canonical).toBe("/shop/gift-packages");
    expect(m.openGraph).toMatchObject({ url: "/shop/gift-packages" });
  });

  it("keeps the share picture and the site's name in its link preview, which a page's own tags would otherwise replace", async () => {
    const m = await meta("gift-packages");
    expect(m.openGraph).toMatchObject({
      type: "website",
      locale: "en_KE",
      siteName: "Watch Fusion Kenya",
      images: [{ url: "/share-image.png", width: 1200, height: 630 }],
    });
  });

  it("is left in the search results when plain or on a later page, and left out when it shows a search or filters", async () => {
    expect((await meta("gift-packages")).robots).toBeUndefined();
    expect((await meta("gift-packages", { page: "2" })).robots).toBeUndefined();
    expect((await meta("gift-packages", { sort: "asc price" })).robots).toMatchObject({ index: false });
  });

  it("is kept out of search results for a category that does not exist", async () => {
    expect((await meta("no-such-category")).robots).toMatchObject({ index: false });
  });
});
