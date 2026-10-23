import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  pages: [] as { items: { slug?: string; lastUpdated?: string }[] }[],
  fail: false,
  categories: [] as { id: string; name: string; slug: string }[],
  categoriesFail: false,
}));

vi.mock("@/lib/wixClientServer", () => ({
  wixClientServer: async () => {
    const result = (index: number): unknown => ({
      items: state.pages[index]?.items ?? [],
      hasNext: () => index + 1 < state.pages.length,
      next: async () => result(index + 1),
    });
    return {
      fetchWithAuth: async () => {
        if (state.categoriesFail) return new Response("{}", { status: 500 });
        return new Response(JSON.stringify({ categories: state.categories }), { status: 200 });
      },
      products: {
        queryProducts: () => ({
          limit: () => ({
            find: async () => {
              if (state.fail) throw new Error("wix down");
              return result(0);
            },
          }),
        }),
      },
    };
  },
}));

import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { SITE_URL } from "@/lib/site";

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });

describe("SITE_URL", () => {
  it("is the address the shop is served from, with www, because the plain address only redirects to it", () => {
    expect(SITE_URL).toBe("https://www.watchfusionkenya.com");
  });

  it("is the only form of the address in the code, so no page or file points search engines at the redirecting one", () => {
    const offenders = sourceFiles(join(process.cwd(), "src")).filter((file) =>
      /https:\/\/watchfusionkenya\.com/.test(readFileSync(file, "utf8"))
    );
    expect(offenders).toEqual([]);
  });
});

describe("sitemap", () => {
  beforeEach(() => {
    state.fail = false;
    state.pages = [];
    state.categories = [];
    state.categoriesFail = false;
  });

  it("lists the main pages on the www address", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toEqual(expect.arrayContaining([SITE_URL, `${SITE_URL}/shop`, `${SITE_URL}/deals`, `${SITE_URL}/contact`]));
    expect(urls.every((url) => url.startsWith(SITE_URL))).toBe(true);
  });

  it("lists every product, across all pages of results, and skips any without a slug", async () => {
    state.pages = [
      { items: [{ slug: "a", lastUpdated: "2026-10-01T00:00:00Z" }, { slug: "" }] },
      { items: [{ slug: "b" }, { slug: "c" }] },
    ];
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toEqual(expect.arrayContaining([`${SITE_URL}/a`, `${SITE_URL}/b`, `${SITE_URL}/c`]));
    expect(urls).not.toContain(`${SITE_URL}/`);
    expect(urls.filter((u) => u === SITE_URL)).toHaveLength(1);
  });

  it("does not list the same address twice", async () => {
    state.pages = [{ items: [{ slug: "a" }, { slug: "a" }] }];
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls.filter((u) => u === `${SITE_URL}/a`)).toHaveLength(1);
  });

  it("lists a page for each category the store shows, at its own address", async () => {
    state.categories = [
      { id: "1", name: "Gift Packages", slug: "gift-packages" },
      { id: "2", name: "Casio", slug: "casio-watches-kenya" },
    ];
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toEqual(expect.arrayContaining([`${SITE_URL}/shop/gift-packages`, `${SITE_URL}/shop/casio-watches-kenya`]));
  });

  it("does not list the store's own All Products category, which is the plain shop already listed", async () => {
    state.categories = [{ id: "1", name: "All Products", slug: "all-products" }];
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).not.toContain(`${SITE_URL}/shop/all-products`);
    expect(urls.filter((u) => u === `${SITE_URL}/shop`)).toHaveLength(1);
  });

  it("still lists the main pages and the products when the categories cannot be read", async () => {
    state.categoriesFail = true;
    state.pages = [{ items: [{ slug: "a" }] }];
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toEqual(expect.arrayContaining([`${SITE_URL}/shop`, `${SITE_URL}/a`]));
  });

  it("still lists the main pages when the products cannot be read", async () => {
    state.fail = true;
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain(`${SITE_URL}/shop`);
  });
});

describe("robots", () => {
  it("points to the sitemap on the www address and keeps private pages out", () => {
    const result = robots();
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rule.disallow).toEqual(expect.arrayContaining(["/api/", "/login", "/profile", "/orders/"]));
  });
});
