import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  configured: true,
  rows: [{ _id: "r1", data: { title: "UNEP / GIGIRI", road: "Limuru Road", price: 450 } }] as unknown[],
  cartId: "cart-1" as string | null,
  adminCalls: [] as { path: string; method: string }[],
}));

vi.mock("@/lib/wixAdmin", () => ({
  adminConfigured: () => state.configured,
  adminFetch: async (path: string, init?: RequestInit) => {
    state.adminCalls.push({ path, method: init?.method ?? "GET" });
    return new Response(JSON.stringify({ cart: { id: "cart-1", lineItems: [] } }), { status: 200 });
  },
}));
vi.mock("@/lib/wixClientServer", () => ({
  wixClientServer: async () => ({
    items: { query: () => ({ limit: () => ({ find: async () => ({ items: state.rows }) }) }) },
    currentCart: { getCurrentCart: async () => (state.cartId ? { _id: state.cartId } : null) },
  }),
}));

import { DELETE, GET, POST } from "@/app/api/delivery/route";

const req = (method: string, body?: unknown, headers: Record<string, string> = {}) =>
  new Request("https://www.watchfusionkenya.com/api/delivery", {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

beforeEach(() => {
  state.configured = true;
  state.cartId = "cart-1";
  state.adminCalls = [];
});

describe("GET /api/delivery", () => {
  it("lists the areas with their fees and says delivery is on", async () => {
    const json = await (await GET()).json();
    expect(json.enabled).toBe(true);
    expect(json.areas.map((a: { place: string }) => a.place)).toEqual(["Unep", "Gigiri"]);
  });

  it("says delivery is off, with no areas, when the server has no secret", async () => {
    state.configured = false;
    expect(await (await GET()).json()).toEqual({ enabled: false, areas: [] });
  });

  it("lets the answer be kept for a minute, so a price change shows soon without a call per visitor", async () => {
    expect((await GET()).headers.get("cache-control")).toMatch(/s-maxage=60/);
  });
});

describe("POST /api/delivery", () => {
  it("adds the chosen area's fee to the cart", async () => {
    const res = await POST(req("POST", { areaId: "r1:1" }));
    expect(res.status).toBe(200);
    expect((await res.json()).price).toBe(450);
    expect(state.adminCalls.some((c) => c.path.endsWith("/add-line-items"))).toBe(true);
  });

  it("refuses a body that is not JSON, and an unknown area", async () => {
    const bad = new Request("https://www.watchfusionkenya.com/api/delivery", { method: "POST", body: "not json" });
    expect((await POST(bad)).status).toBe(400);
    expect((await POST(req("POST", { areaId: "nope" }))).status).toBe(404);
  });

  it("is off, without calling Wix, when the secret is missing", async () => {
    state.configured = false;
    const res = await POST(req("POST", { areaId: "r1:1" }));
    expect(res.status).toBe(503);
    expect(state.adminCalls).toEqual([]);
  });

  it("refuses a request that comes from another website", async () => {
    const res = await POST(req("POST", { areaId: "r1:1" }, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
    expect(state.adminCalls).toEqual([]);
  });

  it("accepts a request from the shop's own address", async () => {
    const res = await POST(req("POST", { areaId: "r1:1" }, { origin: "https://www.watchfusionkenya.com" }));
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/delivery", () => {
  it("takes the delivery line out, and refuses another website", async () => {
    expect((await DELETE(req("DELETE"))).status).toBe(200);
    expect((await DELETE(req("DELETE", undefined, { origin: "https://evil.example" }))).status).toBe(403);
  });
});
