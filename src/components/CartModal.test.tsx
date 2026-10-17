import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  cart: {} as Record<string, unknown>,
  delivery: { enabled: false } as { enabled: boolean },
}));
vi.mock("@/hooks/useCartStore", () => ({
  useCartStore: () => ({ cart: state.cart, isLoading: false, removeItem: () => {} }),
}));
vi.mock("@/hooks/useWixClient", () => ({ useWixClient: () => ({}) }));
vi.mock("@/hooks/useDelivery", () => ({ default: () => ({ ...state.delivery, areas: [], loaded: true, choose: async () => {}, clear: async () => {} }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }));

import CartModal from "@/components/CartModal";

const product = { _id: "p1", productName: { original: "Naviforce NF9269" }, price: { formattedAmount: "KES 3,500" }, quantity: 1 };
const fee = { _id: "d1", productName: { original: "Delivery: Gigiri, Limuru Road" }, price: { amount: "450", formattedAmount: "KES 450" }, quantity: 1 };
const render = () => renderToStaticMarkup(<CartModal onClose={() => {}} />);

beforeEach(() => {
  state.delivery = { enabled: true };
  state.cart = { lineItems: [product, fee], subtotal: { amount: "3950", formattedAmount: "KES 3,950" } };
});

describe("CartModal", () => {
  it("lists the products and not the delivery fee line", () => {
    const html = render();
    expect(html).toContain("Naviforce NF9269");
    expect(html).not.toContain("Delivery: Gigiri");
  });

  it("shows the subtotal of the products alone, since the fee is added on the cart page", () => {
    const html = render();
    expect(html).toContain("KES 3,500");
    expect(html).not.toContain("KES 3,950");
    expect(html).toContain("Delivery fee is added on the cart page.");
  });

  it("is empty when the cart holds only a delivery fee", () => {
    state.cart = { lineItems: [fee], subtotal: { amount: "450", formattedAmount: "KES 450" } };
    expect(render()).toContain("Your cart is empty");
  });

  it("keeps the old wording when delivery fees are off", () => {
    state.delivery = { enabled: false };
    state.cart = { lineItems: [product], subtotal: { amount: "3500", formattedAmount: "KES 3,500" } };
    expect(render()).toContain("Shipping and taxes calculated at checkout.");
  });
});
