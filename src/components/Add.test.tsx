import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }));
vi.mock("@/hooks/useWixClient", () => ({ useWixClient: () => ({}) }));
vi.mock("@/hooks/useCartStore", () => ({ useCartStore: () => ({ addItem: () => {}, isLoading: false }) }));

import Add from "@/components/Add";

const render = (stockNumber: number) => renderToStaticMarkup(<Add productId="p" variantId="v" stockNumber={stockNumber} />);
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

describe("Add (quantity row)", () => {
  it("puts the quantity stepper and the Add to Cart button on one row, lined up in the middle, with the button taking the rest of the width", () => {
    const html = render(5);
    const row = html.match(/<div class="([^"]*)"[^>]*><div class="[^"]*rounded-3xl/)?.[1].split(" ") ?? [];
    expect(row).toContain("flex");
    expect(row).toContain("items-center");
    expect(html).toMatch(/<button[^>]*class="[^"]*\bflex-1\b[^"]*"[^>]*>Add to Cart</);
  });

  it("gives the stepper buttons names for screen readers and a size that is easy to tap", () => {
    const html = render(5);
    expect(html).toContain('aria-label="Decrease quantity"');
    expect(html).toContain('aria-label="Increase quantity"');
    expect(html).toMatch(/aria-label="Increase quantity"[^>]*class="[^"]*\bw-10\b/);
  });

  it("never says 9999 items are left: that number only means the quantity is not tracked", () => {
    const t = text(render(9999));
    expect(t).not.toContain("9999");
    expect(t).toContain("In stock");
    expect(t).not.toMatch(/Only/);
  });

  it("says how many are left only when few are", () => {
    expect(text(render(3))).toContain("Only 3 left");
    expect(text(render(12))).toContain("Only 12 left");
    expect(text(render(150))).toContain("In stock");
  });

  it("says when the product is sold out, and disables the button", () => {
    const html = render(0);
    expect(text(html)).toContain("out of stock");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Add to Cart</);
  });

  it("puts the stock note under the row, left aligned, as one short line", () => {
    const html = render(3);
    expect(html.indexOf("Choose a Quantity")).toBeLessThan(html.indexOf("Only "));
    expect(html.indexOf("Only ")).toBeGreaterThan(html.indexOf("Add to Cart"));
    expect(html).not.toContain("<br");
  });
});
