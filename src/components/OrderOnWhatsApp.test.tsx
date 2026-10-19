import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import OrderOnWhatsApp from "@/components/OrderOnWhatsApp";

const html = renderToStaticMarkup(
  <OrderOnWhatsApp name="Naviforce NF9269" price={3500} url="https://www.watchfusionkenya.com/naviforce-nf9269" />
);

describe("OrderOnWhatsApp", () => {
  it("is a link that opens WhatsApp in a new tab, safely", () => {
    expect(html).toContain('href="https://wa.me/254796044969?text=');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("says what it does, and that it opens a new tab, for a screen reader", () => {
    expect(html).toContain("Order on WhatsApp");
    expect(html).toMatch(/aria-label="Order Naviforce NF9269 on WhatsApp \(opens in a new tab\)"/);
  });

  it("is tall enough to tap on a phone", () => {
    expect(html).toMatch(/min-h-1[12]|min-h-\[4[4-8]px\]|h-1[12]/);
  });

  it("uses colours that work in the light and dark themes, and no pink", () => {
    expect(html).not.toMatch(/pink|rose|fuchsia/);
    expect(html).toContain("text-gray-900");
  });
});
