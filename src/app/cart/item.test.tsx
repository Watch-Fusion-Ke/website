import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const LONG = "Executive Pens perfect for corporate gifting and PR campaigns";
vi.mock("@/hooks/useWixClient", () => ({ useWixClient: () => ({}) }));
vi.mock("@/hooks/useDelivery", () => ({
  default: () => ({ enabled: false, areas: [], loaded: true, unavailable: false, choose: async () => {}, clear: async () => {} }),
}));
vi.mock("@/hooks/useCartStore", () => ({
  useCartStore: () => ({
    cart: {
      lineItems: [{ _id: "1", productName: { original: LONG }, quantity: 1, price: { amount: "300", formattedAmount: "Ksh300.00" }, availability: { status: "AVAILABLE" }, image: "wix:image://v1/abc~mv2.jpg/pens.jpg#originWidth=800&originHeight=800" }],
      subtotal: { formattedAmount: "KES 300" },
    },
    isLoading: false,
    removeItem: () => {},
    getCart: () => {},
  }),
}));

import CartPage from "@/app/cart/page";

const html = renderToStaticMarkup(<CartPage />);
const card = html.slice(html.indexOf("<h3") - 300, html.indexOf("Remove") + 20);

describe("Cart item with a long product name", () => {
  it("keeps the name to at most three lines and lets long words break, so it never looks broken", () => {
    const h3 = html.match(/<h3[^>]*>/)?.[0] ?? "";
    expect(h3).toMatch(/\bline-clamp-3\b/);
    expect(h3).toMatch(/\bbreak-words\b/);
  });

  it("puts the price on its own line under the name, so the name gets the full width", () => {
    const nameAt = card.indexOf("<h3");
    const priceAt = card.indexOf("Ksh300.00");
    expect(priceAt).toBeGreaterThan(nameAt);
    const row = card.slice(card.lastIndexOf("<div", nameAt), priceAt);
    expect(row).not.toMatch(/justify-between/);
  });

  it("keeps the price on one line and the stock note small and under it", () => {
    expect(card).toMatch(/<p[^>]*whitespace-nowrap[^>]*>Ksh300\.00/);
    expect(card.indexOf("AVAILABLE")).toBeGreaterThan(card.indexOf("Ksh300.00"));
  });

  it("uses a smaller photo on phones so the text has room, and the old size from sm up", () => {
    expect(html).toMatch(/<div class="[^"]*\bw-20\b[^"]*\bsm:w-24\b/);
  });

  it("keeps the quantity and the Remove button on one row at the bottom", () => {
    expect(card).toMatch(/justify-between[^>]*><span[^>]*>Qty:/);
  });
});
