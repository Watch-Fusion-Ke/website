import { describe, expect, it } from "vitest";
import { chooseDeliveryArea, clearDelivery, listDelivery, type DeliveryDeps } from "@/lib/deliveryService";
import { areasFromRates, type DeliveryRate } from "@/lib/delivery";

const rates: DeliveryRate[] = [
  { id: "r1", places: "UNEP / GIGIRI", road: "Limuru Road", price: 450 },
  { id: "r2", places: "KILIMANI", road: "Ngong Road", price: 300 },
];
const gigiri = areasFromRates(rates).find((a) => a.place === "Gigiri")!;

type Call = { method: string; path: string; body?: unknown };

const setup = (opts: { cartId?: string | null; existing?: { id: string; name: string }[]; ratesFail?: boolean; wixStatus?: Record<string, number> } = {}) => {
  const calls: Call[] = [];
  const cartId = "cartId" in opts ? opts.cartId : "cart-1";
  const existing = opts.existing ?? [];
  const deps: DeliveryDeps = {
    loadRates: async () => {
      if (opts.ratesFail) throw new Error("no collection");
      return rates;
    },
    getCartId: async () => cartId ?? null,
    adminFetch: async (path, init) => {
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ method, path, body });
      const status = opts.wixStatus?.[`${method} ${path.split("/").slice(-1)[0]}`] ?? 200;
      if (status !== 200) return new Response(JSON.stringify({ message: "nope" }), { status });
      if (method === "GET") {
        return new Response(JSON.stringify({ cart: { id: cartId, lineItems: [{ id: "p1", name: { original: "Watch" } }, ...existing.map((e) => ({ id: e.id, name: { original: e.name } }))] } }), { status: 200 });
      }
      if (path.endsWith("/add-line-items")) {
        return new Response(JSON.stringify({ cart: { id: cartId, lineItems: [{ id: "p1", name: { original: "Watch" } }, ...existing.map((e) => ({ id: e.id, name: { original: e.name } })), { id: "new-1", name: { original: body.customItems[0].name.original } }] } }), { status: 200 });
      }
      return new Response(JSON.stringify({ cart: { id: cartId, lineItems: [] } }), { status: 200 });
    },
  };
  return { deps, calls };
};

describe("listDelivery", () => {
  it("is on, with the areas, when the shop's rates are there", async () => {
    const { deps } = setup();
    const r = await listDelivery(deps, true);
    expect(r.enabled).toBe(true);
    expect(r.areas.map((a) => a.place).sort()).toEqual(["Gigiri", "Kilimani", "Unep"]);
  });

  it("is off when the secret is missing, so the shop works as before", async () => {
    const { deps } = setup();
    expect(await listDelivery(deps, false)).toEqual({ enabled: false, areas: [] });
  });

  it("is off when the rates cannot be read or there are none", async () => {
    expect(await listDelivery(setup({ ratesFail: true }).deps, true)).toEqual({ enabled: false, areas: [] });
    const empty = setup().deps;
    empty.loadRates = async () => [];
    expect(await listDelivery(empty, true)).toEqual({ enabled: false, areas: [] });
  });
});

describe("chooseDeliveryArea", () => {
  it("adds one delivery line to the shopper's cart, priced from the shop's own table", async () => {
    const { deps, calls } = setup();
    const r = await chooseDeliveryArea(deps, gigiri.id);
    expect(r.status).toBe(200);
    const add = calls.find((c) => c.path.endsWith("/add-line-items"))!;
    expect(add.path).toBe("/ecom/v2/carts/cart-1/add-line-items");
    expect(add.body).toEqual({
      customItems: [
        {
          name: { original: "Delivery: Gigiri, Limuru Road" },
          quantityInfo: { requestedQuantity: 1, fixedQuantity: true },
          pricing: { price: { amount: "450.00" } },
          attributes: { itemType: { preset: "SERVICE" } },
        },
      ],
    });
  });

  it("never takes a price from the shopper's request, only an area id", async () => {
    const { deps, calls } = setup();
    await chooseDeliveryArea(deps, gigiri.id);
    expect(JSON.stringify(calls)).not.toContain("999");
    expect((await chooseDeliveryArea(deps, "r1:99")).status).toBe(404);
  });

  it("replaces an earlier delivery line, after the new one is in, and leaves products alone", async () => {
    const { deps, calls } = setup({ existing: [{ id: "old-1", name: "Delivery: Kilimani, Ngong Road" }] });
    const r = await chooseDeliveryArea(deps, gigiri.id);
    expect(r.status).toBe(200);
    const order = calls.map((c) => c.path.split("/").pop());
    expect(order.indexOf("add-line-items")).toBeLessThan(order.indexOf("remove-line-items"));
    const remove = calls.find((c) => c.path.endsWith("/remove-line-items"))!;
    expect(remove.body).toEqual({ lineItemIds: ["old-1"] });
  });

  it("removes every other delivery line after the add, so two requests at once cannot leave two fees", async () => {
    const { deps, calls } = setup({ existing: [{ id: "old-1", name: "Delivery: A, X" }, { id: "old-2", name: "Delivery: B, Y" }] });
    await chooseDeliveryArea(deps, gigiri.id);
    const remove = calls.find((c) => c.path.endsWith("/remove-line-items"))!;
    expect((remove.body as { lineItemIds: string[] }).lineItemIds.sort()).toEqual(["old-1", "old-2"]);
  });

  it("takes the new line back out when the old one cannot be removed, so the cart never holds two fees", async () => {
    const { deps, calls } = setup({ existing: [{ id: "old-1", name: "Delivery: A, X" }], wixStatus: { "POST remove-line-items": 500 } });
    const r = await chooseDeliveryArea(deps, gigiri.id);
    expect(r.status).toBe(502);
    const removes = calls.filter((c) => c.path.endsWith("/remove-line-items"));
    expect(removes.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(removes.at(-1)!.body)).toContain("new-1");
  });

  it("does not remove anything when there was no earlier delivery line", async () => {
    const { deps, calls } = setup();
    await chooseDeliveryArea(deps, gigiri.id);
    expect(calls.some((c) => c.path.endsWith("/remove-line-items"))).toBe(false);
  });

  it("says there is no cart yet when the shopper has nothing in it", async () => {
    const { deps, calls } = setup({ cartId: null });
    const r = await chooseDeliveryArea(deps, gigiri.id);
    expect(r.status).toBe(409);
    expect(calls).toEqual([]);
  });

  it("refuses an area id that is not text of a sensible length", async () => {
    const { deps } = setup();
    for (const bad of ["", "x".repeat(200), 5 as unknown as string, undefined as unknown as string]) {
      expect((await chooseDeliveryArea(deps, bad)).status).toBe(400);
    }
  });

  it("reports a problem with Wix as a gateway error and keeps the old line when adding fails", async () => {
    const { deps, calls } = setup({ existing: [{ id: "old-1", name: "Delivery: Kilimani, Ngong Road" }], wixStatus: { "POST add-line-items": 403 } });
    const r = await chooseDeliveryArea(deps, gigiri.id);
    expect(r.status).toBe(502);
    expect(calls.some((c) => c.path.endsWith("/remove-line-items"))).toBe(false);
  });

  it("marks a failure to add the fee as one the shop can work around, and a bad request as the shopper's own", async () => {
    const down = setup({ wixStatus: { "POST add-line-items": 500 } });
    expect((await chooseDeliveryArea(down.deps, gigiri.id)).body).toMatchObject({ unavailable: true });
    expect((await chooseDeliveryArea(setup().deps, "nope")).body).not.toHaveProperty("unavailable");
    expect((await chooseDeliveryArea(setup({ ratesFail: true }).deps, gigiri.id)).body).toMatchObject({ unavailable: true });
  });

  it("reports unavailable when the rates cannot be read", async () => {
    expect((await chooseDeliveryArea(setup({ ratesFail: true }).deps, gigiri.id)).status).toBe(503);
  });
});

describe("clearDelivery", () => {
  it("removes the delivery lines and only those", async () => {
    const { deps, calls } = setup({ existing: [{ id: "old-1", name: "Delivery: Kilimani, Ngong Road" }] });
    const r = await clearDelivery(deps);
    expect(r.status).toBe(200);
    expect(calls.find((c) => c.path.endsWith("/remove-line-items"))!.body).toEqual({ lineItemIds: ["old-1"] });
  });

  it("does nothing when there is no cart or no delivery line", async () => {
    expect((await clearDelivery(setup({ cartId: null }).deps)).status).toBe(200);
    const { deps, calls } = setup();
    expect((await clearDelivery(deps)).status).toBe(200);
    expect(calls.some((c) => c.path.endsWith("/remove-line-items"))).toBe(false);
  });
});
