import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/hooks/useDeliveryFeeSync.ts", "utf8");

describe("the hook that keeps the delivery fee in step with the basket", () => {
  it("hands the work to the shared re-pricing rules and tries again when another run has finished", () => {
    expect(source).toContain("syncFee");
    expect(source).toContain("whenFeeSyncIdle");
  });

  it("is used by both the cart page and the cart pop-up, since either can start a checkout", () => {
    expect(readFileSync("src/app/cart/page.tsx", "utf8")).toContain("useDeliveryFeeSync");
    expect(readFileSync("src/components/CartModal.tsx", "utf8")).toContain("useDeliveryFeeSync");
  });
});
