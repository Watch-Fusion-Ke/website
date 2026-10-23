import { DELIVERY_PREFIX, areasFromRates, deliveryLineName, isFreeDelivery, sumMoney, type DeliveryArea, type DeliveryRate } from "@/lib/delivery";

// What the delivery route does, with the outside world passed in so it can be tested.
// Docs: https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/purchase-flow/cart-v2/add-line-items
//       https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/purchase-flow/cart-v2/remove-line-items

export type DeliveryDeps = {
  loadRates: () => Promise<DeliveryRate[]>;
  getCartId: () => Promise<string | null>;
  adminFetch: (path: string, init?: RequestInit) => Promise<Response>;
};

export type Result<T = Record<string, unknown>> = { status: number; body: T };

// The reason a call failed, for the response and the server log. It is our own message (a status and a Wix error name), never a secret.
const detailOf = (err: unknown): string => (err instanceof Error ? err.message : String(err)).slice(0, 160);

// What the shop's own call to Wix got back, in words: the step, Wix's status and its error name. Never Wix's message or body.
const refusal = async (step: string, response: Response): Promise<string> => {
  const json = await response.clone().json().catch(() => ({}));
  const code = json?.details?.applicationError?.code;
  const detail = `${step} ${response.status}${typeof code === "string" ? ` ${code.slice(0, 60)}` : ""}`;
  console.error("Delivery fee: Wix refused:", detail);
  return detail;
};

// The cause helps whoever sets the shop up, so it is left out of answers on the live site.
export const withoutDetail = <T extends Record<string, unknown>>(body: T, production: boolean): Omit<T, "detail"> | T => {
  if (!production || !("detail" in body)) return body;
  const { detail: _detail, ...rest } = body;
  return rest;
};

// A line of the cart as Cart V2 returns it: `pricing.totalPrice` is the line's final price after discounts (unit price times quantity).
type CartLine = { id?: string; name?: { original?: string }; pricing?: { totalPrice?: { amount?: string } } };
const lines = (cart: { lineItems?: CartLine[] } | undefined): CartLine[] => cart?.lineItems ?? [];
const isDelivery = (line: CartLine) => (line.name?.original ?? "").startsWith(DELIVERY_PREFIX);

// The areas to offer. Off (and the shop works as before) when the secret is missing or the table cannot be read.
export const listDelivery = async (
  deps: DeliveryDeps,
  configured: boolean
): Promise<{ enabled: boolean; areas: DeliveryArea[] }> => {
  if (!configured) return { enabled: false, areas: [] };
  try {
    const areas = areasFromRates(await deps.loadRates());
    return areas.length > 0 ? { enabled: true, areas } : { enabled: false, areas: [] };
  } catch {
    return { enabled: false, areas: [] };
  }
};

type CartRead = { lines: CartLine[] } | { failed: string };

const readCart = async (deps: DeliveryDeps, cartId: string): Promise<CartRead> => {
  const response = await deps.adminFetch(`/ecom/v2/carts/${cartId}`, { method: "GET" });
  if (!response.ok) return { failed: await refusal("read cart", response) };
  return { lines: lines((await response.json()).cart) };
};

// Puts the chosen area's fee into the shopper's cart as one delivery line, replacing an earlier one.
// The shopper sends only an area id. The price always comes from the shop's own table, and is nothing when the goods in the cart,
// as the shop reads them from Wix, reach the free-delivery amount.
export const chooseDeliveryArea = async (deps: DeliveryDeps, areaId: unknown): Promise<Result> => {
  if (typeof areaId !== "string" || areaId.length === 0 || areaId.length > 100) {
    return { status: 400, body: { error: "Choose a delivery area." } };
  }

  let areas: DeliveryArea[];
  try {
    areas = areasFromRates(await deps.loadRates());
  } catch {
    return { status: 503, body: { error: "Delivery fees are not available right now.", unavailable: true } };
  }
  const area = areas.find((a) => a.id === areaId);
  if (!area) return { status: 404, body: { error: "We could not find that delivery area." } };

  const cartId = await deps.getCartId();
  if (!cartId) return { status: 409, body: { error: "Your cart is empty." } };

  let free = false;
  let fee = area.price;
  try {
    const read = await readCart(deps, cartId);
    if ("failed" in read) return { status: 502, body: { error: "We could not reach your cart.", unavailable: true, detail: read.failed } };
    const oldIds = read.lines.filter(isDelivery).map((l) => l.id).filter((id): id is string => Boolean(id));
    free = isFreeDelivery(sumMoney(read.lines.filter((l) => !isDelivery(l)).map((l) => l.pricing?.totalPrice?.amount)));
    fee = free ? 0 : area.price;

    const add = await deps.adminFetch(`/ecom/v2/carts/${cartId}/add-line-items`, {
      method: "POST",
      body: JSON.stringify({
        customItems: [
          {
            name: { original: deliveryLineName(area) },
            quantityInfo: { requestedQuantity: 1, fixedQuantity: true },
            pricing: { price: { amount: `${fee.toFixed(2)}` } },
            attributes: { itemType: { preset: "SERVICE" } },
          },
        ],
      }),
    });
    if (!add.ok) {
      const detail = await refusal("add fee", add);
      // A free line that Wix will not take must not leave the earlier paid fee in the cart for a basket that now qualifies, so that fee goes.
      if (free && oldIds.length > 0) {
        await deps.adminFetch(`/ecom/v2/carts/${cartId}/remove-line-items`, { method: "POST", body: JSON.stringify({ lineItemIds: oldIds }) }).catch(() => null);
      }
      return { status: 502, body: { error: "We could not add the delivery fee.", unavailable: true, detail } };
    }

    // Keep exactly one delivery line: the one just added. Anything else, including a line from a request
    // that ran at the same moment, goes. If that fails the new line is taken back out too, so the cart never holds two fees.
    const after = lines((await add.json().catch(() => ({})))?.cart).filter(isDelivery);
    const newId = after.map((l) => l.id).filter((id): id is string => Boolean(id) && !oldIds.includes(id as string)).pop();
    const staleIds = newId ? after.map((l) => l.id).filter((id): id is string => Boolean(id) && id !== newId) : oldIds;
    if (staleIds.length > 0) {
      const remove = await deps.adminFetch(`/ecom/v2/carts/${cartId}/remove-line-items`, {
        method: "POST",
        body: JSON.stringify({ lineItemIds: staleIds }),
      });
      if (!remove.ok) {
        let rolledBack = !newId;
        if (newId) {
          const undo = await deps.adminFetch(`/ecom/v2/carts/${cartId}/remove-line-items`, {
            method: "POST",
            body: JSON.stringify({ lineItemIds: [newId] }),
          }).catch(() => null);
          rolledBack = Boolean(undo?.ok);
        }
        const error = rolledBack
          ? "We could not replace the earlier delivery fee."
          : "We could not set the delivery fee. Please check your cart before paying.";
        return { status: 502, body: { error, unavailable: true, detail: await refusal("remove old fee", remove) } };
      }
    }
  } catch (err) {
    const detail = detailOf(err);
    console.error("Delivery fee: could not add the fee:", detail);
    return { status: 502, body: { error: "We could not add the delivery fee.", unavailable: true, detail } };
  }

  return { status: 200, body: { areaId: area.id, label: `${area.place}${area.road ? `, ${area.road}` : ""}`, price: fee, free } };
};

// Takes the delivery line out of the cart, for example when the last product is removed.
export const clearDelivery = async (deps: DeliveryDeps): Promise<Result> => {
  const cartId = await deps.getCartId();
  if (!cartId) return { status: 200, body: {} };
  try {
    const read = await readCart(deps, cartId);
    const ids = ("lines" in read ? read.lines : []).filter(isDelivery).map((l) => l.id).filter((id): id is string => Boolean(id));
    if (ids.length === 0) return { status: 200, body: {} };
    const remove = await deps.adminFetch(`/ecom/v2/carts/${cartId}/remove-line-items`, {
      method: "POST",
      body: JSON.stringify({ lineItemIds: ids }),
    });
    if (!remove.ok) return { status: 502, body: { error: "We could not remove the delivery fee.", detail: await refusal("remove fee", remove) } };
  } catch (err) {
    const detail = detailOf(err);
    console.error("Delivery fee: could not remove the fee:", detail);
    return { status: 502, body: { error: "We could not remove the delivery fee.", detail } };
  }
  return { status: 200, body: {} };
};
