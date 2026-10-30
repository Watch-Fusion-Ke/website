import { describe, expect, it } from "vitest";
import { chooseDeliveryArea, clearDelivery, listDelivery, withoutDetail, type DeliveryDeps } from "@/lib/deliveryService";
import { areasFromRates, type DeliveryRate } from "@/lib/delivery";

const rates: DeliveryRate[] = [
  { id: "r1", places: "UNEP / GIGIRI", road: "Limuru Road", price: 450 },
  { id: "r2", places: "KILIMANI", road: "Ngong Road", price: 300 },
];
const gigiri = areasFromRates(rates).find((a) => a.place === "Gigiri")!;

type Call = { method: string; path: string; body?: unknown };

const setup = (opts: { cartId?: string | null; existing?: { id: string; name: string; price?: string }[]; ratesFail?: boolean; wixStatus?: Record<string, number>; goods?: { total?: string; quantity?: number }[] } = {}) => {
  const calls: Call[] = [];
  const cartId = "cartId" in opts ? opts.cartId : "cart-1";
  const existing = opts.existing ?? [];
  // Products as Cart V2 returns them: the line's final total after discounts is `pricing.totalPrice.amount`, the quantity is in `quantityInfo`.
  const goods = (opts.goods ?? [{}]).map((g, i) => ({
    id: i === 0 ? "p1" : `p${i + 1}`,
    name: { original: "Watch" },
    ...(g.total ? { pricing: { unitPrice: { amount: g.total }, totalPrice: { amount: g.total } } } : {}),
    quantityInfo: { requestedQuantity: g.quantity ?? 1, confirmedQuantity: g.quantity ?? 1 },
  }));
  const lineOf = (e: { id: string; name: string; price?: string }) => ({ id: e.id, name: { original: e.name }, ...(e.price ? { pricing: { totalPrice: { amount: e.price } } } : {}), quantityInfo: { confirmedQuantity: 1 } });
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
        return new Response(JSON.stringify({ cart: { id: cartId, lineItems: [...goods, ...existing.map(lineOf)] } }), { status: 200 });
      }
      if (path.endsWith("/add-line-items")) {
        return new Response(JSON.stringify({ cart: { id: cartId, lineItems: [...goods, ...existing.map(lineOf), { id: "new-1", name: { original: body.customItems[0].name.original } }] } }), { status: 200 });
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

  describe("free delivery", () => {
    const addBody = (calls: Call[]) => calls.find((c) => c.path.endsWith("/add-line-items"))!.body as { customItems: { name: { original: string }; pricing: { price: { amount: string } } }[] };

    it("charges nothing when the products come to more than Ksh 10,000, and keeps the area's name on the line", async () => {
      const { deps, calls } = setup({ goods: [{ total: "13000.00", quantity: 2 }] });
      const r = await chooseDeliveryArea(deps, gigiri.id);
      expect(r.status).toBe(200);
      const item = addBody(calls).customItems[0];
      expect(item.pricing.price.amount).toBe("0.00");
      expect(item.name.original).toBe("Delivery: Gigiri, Limuru Road");
      expect(r.body).toMatchObject({ areaId: gigiri.id, price: 0, free: true });
    });

    it("adds up several products, not just one", async () => {
      const { deps, calls } = setup({ goods: [{ total: "6000" }, { total: "4500" }] });
      await chooseDeliveryArea(deps, gigiri.id);
      expect(addBody(calls).customItems[0].pricing.price.amount).toBe("0.00");
    });

    it("is free at exactly Ksh 10,000, and still charges the area's fee below it", async () => {
      const exact = setup({ goods: [{ total: "10000", quantity: 2 }] });
      const r = await chooseDeliveryArea(exact.deps, gigiri.id);
      expect(addBody(exact.calls).customItems[0].pricing.price.amount).toBe("0.00");
      expect(r.body).toMatchObject({ price: 0, free: true });
      const justUnder = setup({ goods: [{ total: "9999.99" }] });
      await chooseDeliveryArea(justUnder.deps, gigiri.id);
      expect(addBody(justUnder.calls).customItems[0].pricing.price.amount).toBe("450.00");
      const small = setup({ goods: [{ total: "6500" }] });
      await chooseDeliveryArea(small.deps, gigiri.id);
      expect(addBody(small.calls).customItems[0].pricing.price.amount).toBe("450.00");
    });

    it("charges the fee when a product's price cannot be read, so a fault never gives delivery away", async () => {
      const { deps, calls } = setup({ goods: [{}, {}] });
      await chooseDeliveryArea(deps, gigiri.id);
      expect(addBody(calls).customItems[0].pricing.price.amount).toBe("450.00");
    });

    it("does not count an earlier delivery line towards the goods", async () => {
      const { deps, calls } = setup({ goods: [{ total: "6000" }], existing: [{ id: "old-1", name: "Delivery: Kilimani, Ngong Road", price: "9000" }] });
      await chooseDeliveryArea(deps, gigiri.id);
      expect(addBody(calls).customItems[0].pricing.price.amount).toBe("450.00");
    });

    it("reads the final price of each line after discounts, the field Cart V2 really returns, and not an older cart's price field", async () => {
      const { deps, calls } = setup({ goods: [{ total: "6500" }, { total: "6500" }] });
      await chooseDeliveryArea(deps, gigiri.id);
      expect(addBody(calls).customItems[0].pricing.price.amount).toBe("0.00");
    });

    it("sums to the cent: exactly Ksh 10,000 in odd amounts is free, one cent less pays", async () => {
      const exact = setup({ goods: [{ total: "4742.70" }, { total: "4148.02" }, { total: "1109.28" }] });
      await chooseDeliveryArea(exact.deps, gigiri.id);
      expect(addBody(exact.calls).customItems[0].pricing.price.amount).toBe("0.00");
      const under = setup({ goods: [{ total: "4742.70" }, { total: "4148.02" }, { total: "1109.27" }] });
      await chooseDeliveryArea(under.deps, gigiri.id);
      expect(addBody(under.calls).customItems[0].pricing.price.amount).toBe("450.00");
    });

    it("takes the earlier fee out when the free line is refused, so the shopper is not left paying a fee they no longer owe", async () => {
      const { deps, calls } = setup({ goods: [{ total: "13000", quantity: 2 }], existing: [{ id: "old-1", name: "Delivery: Gigiri, Limuru Road", price: "450" }], wixStatus: { "POST add-line-items": 400 } });
      const r = await chooseDeliveryArea(deps, gigiri.id);
      expect(r.status).toBe(502);
      expect(r.body).toMatchObject({ unavailable: true });
      const remove = calls.find((c) => c.path.endsWith("/remove-line-items"));
      expect(remove?.body).toEqual({ lineItemIds: ["old-1"] });
    });

    it("leaves the earlier fee alone when a paid line is refused, as before", async () => {
      const { deps, calls } = setup({ goods: [{ total: "5000" }], existing: [{ id: "old-1", name: "Delivery: Kilimani, Ngong Road", price: "300" }], wixStatus: { "POST add-line-items": 400 } });
      await chooseDeliveryArea(deps, gigiri.id);
      expect(calls.some((c) => c.path.endsWith("/remove-line-items"))).toBe(false);
    });

    it("works out the fee from the cart on the server, never from anything the shopper sends", async () => {
      const { deps, calls } = setup({ goods: [{ total: "100" }] });
      await chooseDeliveryArea(deps, gigiri.id);
      expect(addBody(calls).customItems[0].pricing.price.amount).toBe("450.00");
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

  it("tells the shopper to check the cart when even taking the new line back out fails", async () => {
    const { deps } = setup({ existing: [{ id: "old-1", name: "Delivery: A, X" }], wixStatus: { "POST remove-line-items": 500 } });
    const r = await chooseDeliveryArea(deps, gigiri.id);
    expect(r.status).toBe(502);
    expect(JSON.stringify(r.body)).toMatch(/check your cart/i);
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

  it("says why when Wix refuses the shop's admin access, so the cause can be found", async () => {
    const { deps } = setup();
    deps.adminFetch = async () => {
      throw new Error("Wix admin token request failed (400 invalid_client)");
    };
    const r = await chooseDeliveryArea(deps, gigiri.id);
    expect(r.status).toBe(502);
    expect(r.body).toMatchObject({ unavailable: true });
    expect((r.body as { detail?: string }).detail).toMatch(/400 invalid_client/);
  });

  it("names the Wix status and error when Wix answers with a refusal instead of failing outright", async () => {
    const deps = setup().deps;
    deps.adminFetch = async () =>
      new Response(JSON.stringify({ message: "secret body text", details: { applicationError: { code: "OWNED_CART_NOT_FOUND" } } }), { status: 404 });
    const read = await chooseDeliveryArea(deps, gigiri.id);
    expect(read.body).toMatchObject({ unavailable: true });
    expect((read.body as { detail?: string }).detail).toBe("read cart 404 OWNED_CART_NOT_FOUND");

    const refused = setup({ wixStatus: { "POST add-line-items": 403 } });
    const add = await chooseDeliveryArea(refused.deps, gigiri.id);
    expect((add.body as { detail?: string }).detail).toBe("add fee 403");
    expect(JSON.stringify(add.body)).not.toContain("nope");
  });

  it("gives no detail for a failure that is only the shopper's own", async () => {
    expect((await chooseDeliveryArea(setup().deps, "nope")).body).not.toHaveProperty("detail");
  });

  it("reports unavailable when the rates cannot be read", async () => {
    expect((await chooseDeliveryArea(setup({ ratesFail: true }).deps, gigiri.id)).status).toBe(503);
  });
});

describe("clearDelivery when Wix refuses admin access", () => {
  it("says why", async () => {
    const { deps } = setup();
    deps.adminFetch = async () => {
      throw new Error("Wix admin token request failed (400 invalid_client)");
    };
    const r = await clearDelivery(deps);
    expect(r.status).toBe(502);
    expect((r.body as { detail?: string }).detail).toMatch(/invalid_client/);
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

describe("withoutDetail", () => {
  it("keeps the cause out of the answer on the live site and in it elsewhere", () => {
    const body = { error: "We could not add the delivery fee.", unavailable: true, detail: "add fee 403" };
    expect(withoutDetail(body, true)).toEqual({ error: "We could not add the delivery fee.", unavailable: true });
    expect(withoutDetail(body, false)).toEqual(body);
    expect(withoutDetail({ price: 300 }, true)).toEqual({ price: 300 });
  });
});
