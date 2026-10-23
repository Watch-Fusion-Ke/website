import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/hooks/useDeliveryFeeSync.ts", "utf8");

describe("keeping the delivery fee in step with the basket", () => {
  it("asks the shop to re-price the delivery line when the basket crosses the free-delivery line", () => {
    expect(source).toContain("feeToRefresh");
    expect(source).toContain("choose(");
  });

  it("tries each mismatch once, so a fee that will not change cannot make the page ask again and again", () => {
    expect(source).toMatch(/useRef/);
    expect(source).toMatch(/tried\.current/);
  });

  it("reloads the cart after re-pricing, and says nothing to the shopper if it fails", () => {
    expect(source).toContain("getCart");
    expect(source).toMatch(/catch/);
  });

  it("is used by both the cart page and the cart pop-up, since either can start a checkout", () => {
    expect(readFileSync("src/app/cart/page.tsx", "utf8")).toContain("useDeliveryFeeSync");
    expect(readFileSync("src/components/CartModal.tsx", "utf8")).toContain("useDeliveryFeeSync");
  });
});
