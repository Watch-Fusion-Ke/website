import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ products: [] as unknown[], fail: false, bodies: [] as unknown[] }));

vi.mock("@/lib/wixClientServer", () => ({
  wixClientServer: async () => ({
    fetchWithAuth: async (_url: string, init?: RequestInit) => {
      state.bodies.push(JSON.parse(String(init?.body)));
      if (state.fail) return new Response("{}", { status: 500 });
      return new Response(JSON.stringify({ products: state.products }), { status: 200 });
    },
  }),
}));

import { GET } from "@/app/api/search/route";
import { clearCatalogueCache } from "@/lib/catalogueCache";

const product = (n: number, name: string) => ({
  id: `id-${n}`,
  slug: `p-${n}`,
  name,
  actualPriceRange: { minValue: { amount: "6500.00" }, maxValue: { amount: "6500.00" } },
  media: { main: { image: { url: `https://img/${n}.jpg` } } },
});
const call = (q: string | null, ip = "1.1.1.1") =>
  GET(new Request(`https://shop.test/api/search${q === null ? "" : `?q=${encodeURIComponent(q)}`}`, { headers: { "x-forwarded-for": ip } }));

beforeEach(() => {
  clearCatalogueCache();
  state.products = [product(1, "Casio MTP-B146D-1AV"), product(2, "Naviforce 9282"), product(3, "Casio Vintage A159WA")];
  state.fail = false;
  state.bodies = [];
});

describe("GET /api/search", () => {
  it("returns the products whose name fits, with only what a suggestion needs", async () => {
    const res = await call("casio");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items.map((i: { name: string }) => i.name)).toEqual(["Casio MTP-B146D-1AV", "Casio Vintage A159WA"]);
    expect(Object.keys(json.items[0]).sort()).toEqual(["compareAtLabel", "id", "imageUrl", "name", "priceLabel", "slug"]);
    expect(json.items[0].priceLabel).toBe("KES 6,500");
    expect(json.hasMore).toBe(false);
  });

  it("reads the shop's product list once for a whole run of searches, however many words are typed", async () => {
    await call("ca");
    await call("cas");
    await call("casio");
    expect(state.bodies).toHaveLength(1);
  });

  it("finds a model number typed in part", async () => {
    const json = await (await call("b146")).json();
    expect(json.items.map((i: { slug: string }) => i.slug)).toEqual(["p-1"]);
  });

  it("answers an empty list, without asking the shop, when fewer than two letters were typed", async () => {
    const json = await (await call("c")).json();
    expect(json).toEqual({ items: [], hasMore: false });
    expect((await (await call(null)).json()).items).toEqual([]);
    expect(state.bodies).toHaveLength(0);
  });

  it("shows six at most and says when there are more", async () => {
    state.products = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => product(n, `Casio ${n}`));
    const json = await (await call("casio")).json();
    expect(json.items).toHaveLength(6);
    expect(json.hasMore).toBe(true);
  });

  it("says so, with a 502, when the shop cannot be reached", async () => {
    state.fail = true;
    const res = await call("casio");
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/search/i);
  });

  it("is never stored by a shared cache, because the reply is for one visitor", async () => {
    expect((await call("casio")).headers.get("cache-control")).toMatch(/private|no-store/);
  });

  it("slows a visitor who asks far too often", async () => {
    let last = 200;
    for (let i = 0; i < 70; i++) last = (await call("casio", "9.9.9.9")).status;
    expect(last).toBe(429);
    expect((await call("casio", "8.8.8.8")).status).toBe(200);
  });
});
