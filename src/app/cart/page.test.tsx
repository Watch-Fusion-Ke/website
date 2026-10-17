import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  cart: {} as Record<string, unknown>,
  delivery: { enabled: false, areas: [] as unknown[], loaded: true } as { enabled: boolean; areas: unknown[]; loaded: boolean },
}));

vi.mock("@/hooks/useCartStore", () => ({
  useCartStore: () => ({ cart: store.cart, isLoading: false, removeItem: () => {}, getCart: () => {} }),
}));
vi.mock("@/hooks/useWixClient", () => ({ useWixClient: () => ({}) }));
vi.mock("@/hooks/useDelivery", () => ({
  default: () => ({ ...store.delivery, choose: async () => {}, clear: async () => {} }),
}));

import CartPage from "@/app/cart/page";
import { areasFromRates } from "@/lib/delivery";

const product = { _id: "p1", productName: { original: "Naviforce NF9269" }, price: { amount: "3500", formattedAmount: "KES 3,500" }, quantity: 1 };
const delivery = { _id: "d1", productName: { original: "Delivery: Gigiri, Limuru Road" }, price: { amount: "450", formattedAmount: "KES 450" }, quantity: 1 };
const areas = areasFromRates([{ id: "r1", places: "GIGIRI", road: "Limuru Road", price: 450 }]);

const render = () => renderToStaticMarkup(<CartPage />);

beforeEach(() => {
  store.cart = { lineItems: [product], subtotal: { amount: "3500", formattedAmount: "KES 3,500" } };
  store.delivery = { enabled: false, areas: [], loaded: true };
});

describe("Cart page when delivery fees are off", () => {
  it("works as before: no picker and checkout is open", () => {
    const html = render();
    expect(html).not.toContain('role="combobox"');
    expect(html).toMatch(/<button[^>]*>Proceed to Checkout<\/button>/);
    expect(html).not.toMatch(/<button[^>]*disabled=""[^>]*>Proceed to Checkout/);
  });
});

describe("Cart page when delivery fees are on", () => {
  beforeEach(() => {
    store.delivery = { enabled: true, areas, loaded: true };
  });

  it("asks where to deliver and holds checkout back until an area is chosen", () => {
    const html = render();
    expect(html).toContain('role="combobox"');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Proceed to Checkout/);
    expect(html).toMatch(/Choose a delivery area to continue/i);
  });

  it("shows the chosen area, the fee as its own row, and opens checkout", () => {
    store.cart = {
      lineItems: [product, delivery],
      subtotal: { amount: "3950", formattedAmount: "KES 3,950" },
    };
    const html = render();
    expect(html).toContain("Delivering to");
    expect(html).toContain("Gigiri, Limuru Road");
    expect(html).toMatch(/Delivery<\/span><span[^>]*>KES 450/);
    expect(html).toMatch(/Subtotal \(1 item\)/);
    expect(html).toContain("KES 3,500");
    expect(html).toContain("KES 3,950");
    expect(html).not.toMatch(/<button[^>]*disabled=""[^>]*>Proceed to Checkout/);
  });

  it("lists only products as cart items, with no Remove button on the delivery fee", () => {
    store.cart = { lineItems: [product, delivery], subtotal: { amount: "3950", formattedAmount: "KES 3,950" } };
    const html = render();
    expect((html.match(/>Remove</g) ?? []).length).toBe(1);
    expect((html.match(/Qty:/g) ?? []).length).toBe(1);
  });

  it("no longer says shipping is calculated at checkout, since the fee is already in the total", () => {
    store.cart = { lineItems: [product, delivery], subtotal: { amount: "3950", formattedAmount: "KES 3,950" } };
    expect(render()).not.toMatch(/Shipping<\/span><span[^>]*>Calculated at checkout/);
  });

  it("treats a cart with only a delivery fee as empty", () => {
    store.cart = { lineItems: [delivery], subtotal: { amount: "450", formattedAmount: "KES 450" } };
    expect(render()).toContain("Your cart is empty");
  });
});
