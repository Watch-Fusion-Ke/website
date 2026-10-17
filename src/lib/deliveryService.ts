import { DELIVERY_PREFIX, areasFromRates, deliveryLineName, type DeliveryArea, type DeliveryRate } from "@/lib/delivery";

// What the delivery route does, with the outside world passed in so it can be tested.
// Docs: https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/purchase-flow/cart-v2/add-line-items
//       https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/purchase-flow/cart-v2/remove-line-items

export type DeliveryDeps = {
  loadRates: () => Promise<DeliveryRate[]>;
  getCartId: () => Promise<string | null>;
  adminFetch: (path: string, init?: RequestInit) => Promise<Response>;
};

export type Result<T = Record<string, unknown>> = { status: number; body: T };

type CartLine = { id?: string; name?: { original?: string } };
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

const readCart = async (deps: DeliveryDeps, cartId: string): Promise<CartLine[] | null> => {
  const response = await deps.adminFetch(`/ecom/v2/carts/${cartId}`, { method: "GET" });
  if (!response.ok) return null;
  return lines((await response.json()).cart);
};

// Puts the chosen area's fee into the shopper's cart as one delivery line, replacing an earlier one.
// The shopper sends only an area id. The price always comes from the shop's own table.
export const chooseDeliveryArea = async (deps: DeliveryDeps, areaId: unknown): Promise<Result> => {
  if (typeof areaId !== "string" || areaId.length === 0 || areaId.length > 100) {
    return { status: 400, body: { error: "Choose a delivery area." } };
  }

  let areas: DeliveryArea[];
  try {
    areas = areasFromRates(await deps.loadRates());
  } catch {
    return { status: 503, body: { error: "Delivery fees are not available right now." } };
  }
  const area = areas.find((a) => a.id === areaId);
  if (!area) return { status: 404, body: { error: "We could not find that delivery area." } };

  const cartId = await deps.getCartId();
  if (!cartId) return { status: 409, body: { error: "Your cart is empty." } };

  try {
    const before = await readCart(deps, cartId);
    if (before === null) return { status: 502, body: { error: "We could not reach your cart." } };
    const oldIds = before.filter(isDelivery).map((l) => l.id).filter((id): id is string => Boolean(id));

    const add = await deps.adminFetch(`/ecom/v2/carts/${cartId}/add-line-items`, {
      method: "POST",
      body: JSON.stringify({
        customItems: [
          {
            name: { original: deliveryLineName(area) },
            quantityInfo: { requestedQuantity: 1, fixedQuantity: true },
            pricing: { price: { amount: `${area.price.toFixed(2)}` } },
            attributes: { itemType: { preset: "SERVICE" } },
          },
        ],
      }),
    });
    if (!add.ok) return { status: 502, body: { error: "We could not add the delivery fee." } };

    if (oldIds.length > 0) {
      const remove = await deps.adminFetch(`/ecom/v2/carts/${cartId}/remove-line-items`, {
        method: "POST",
        body: JSON.stringify({ lineItemIds: oldIds }),
      });
      if (!remove.ok) return { status: 502, body: { error: "We could not replace the earlier delivery fee." } };
    }
  } catch {
    return { status: 502, body: { error: "We could not add the delivery fee." } };
  }

  return { status: 200, body: { areaId: area.id, label: `${area.place}${area.road ? `, ${area.road}` : ""}`, price: area.price } };
};

// Takes the delivery line out of the cart, for example when the last product is removed.
export const clearDelivery = async (deps: DeliveryDeps): Promise<Result> => {
  const cartId = await deps.getCartId();
  if (!cartId) return { status: 200, body: {} };
  try {
    const before = await readCart(deps, cartId);
    const ids = (before ?? []).filter(isDelivery).map((l) => l.id).filter((id): id is string => Boolean(id));
    if (ids.length === 0) return { status: 200, body: {} };
    const remove = await deps.adminFetch(`/ecom/v2/carts/${cartId}/remove-line-items`, {
      method: "POST",
      body: JSON.stringify({ lineItemIds: ids }),
    });
    if (!remove.ok) return { status: 502, body: { error: "We could not remove the delivery fee." } };
  } catch {
    return { status: 502, body: { error: "We could not remove the delivery fee." } };
  }
  return { status: 200, body: {} };
};
