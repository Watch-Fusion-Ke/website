import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useWixClient", () => ({ useWixClient: () => ({}) }));
vi.mock("@/hooks/useDelivery", () => ({
  default: () => ({ enabled: false, areas: [], loaded: true, unavailable: false, choose: async () => {}, clear: async () => {} }),
}));
vi.mock("@/hooks/useCartStore", () => ({
  useCartStore: () => ({
    cart: { lineItems: [{ _id: "1", productName: { original: "Watch" }, quantity: 1, price: { amount: "100" } }], subtotal: { formattedAmount: "KES 100" } },
    isLoading: false,
    removeItem: () => {},
    getCart: () => {},
  }),
}));

import CartPage from "@/app/cart/page";

const html = renderToStaticMarkup(<CartPage />);
const start = html.lastIndexOf("<div", html.indexOf("<h1"));
const header = html.slice(start, html.indexOf("Continue Shopping", start) + 40);

describe("Cart page header on a phone", () => {
  it("uses a title size that leaves room for the link beside it", () => {
    expect(html.match(/<h1[^>]*>/)?.[0]).toMatch(/\btext-3xl\b/);
  });

  it("shows a short Back link on phones and the full wording from sm up", () => {
    expect(header).toMatch(/sm:hidden[^>]*>← Back</);
    expect(header).toMatch(/hidden sm:inline[^>]*>← Continue Shopping</);
  });

  it("keeps the link on one line and the pair apart", () => {
    const link = header.match(/<a [^>]*href="\/shop"[^>]*>/)?.[0] ?? "";
    expect(link).toContain("whitespace-nowrap");
    expect(header).toContain("gap-3");
  });
});
