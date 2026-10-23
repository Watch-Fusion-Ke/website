import { describe, expect, it, vi } from "vitest";
import { syncFee, whenFeeSyncIdle } from "@/lib/feeSync";
import type { DeliveryArea } from "@/lib/delivery";

const area: DeliveryArea = { id: "r1:0", place: "Gigiri", road: "Limuru Road", price: 450 };
const ref = () => ({ current: null as string | null });

describe("keeping the delivery fee in step with the basket", () => {
  it("prices the area again, then reloads the cart", async () => {
    const choose = vi.fn(async () => {});
    const getCart = vi.fn();
    expect(await syncFee(ref(), area, true, choose, getCart)).toBe("done");
    expect(choose).toHaveBeenCalledWith(area);
    expect(getCart).toHaveBeenCalledTimes(1);
  });

  it("tries each mismatch once, so a fee that will not change cannot make it ask again and again", async () => {
    const choose = vi.fn(async () => {});
    const tried = ref();
    await syncFee(tried, area, true, choose, vi.fn());
    expect(await syncFee(tried, area, true, choose, vi.fn())).toBe("skipped");
    expect(choose).toHaveBeenCalledTimes(1);
  });

  it("tries again when the basket crosses the line the other way", async () => {
    const choose = vi.fn(async () => {});
    const tried = ref();
    await syncFee(tried, area, true, choose, vi.fn());
    await syncFee(tried, area, false, choose, vi.fn());
    expect(choose).toHaveBeenCalledTimes(2);
  });

  it("forgets what it tried once nothing needs fixing", async () => {
    const choose = vi.fn(async () => {});
    const tried = ref();
    await syncFee(tried, area, true, choose, vi.fn());
    await syncFee(tried, null, true, choose, vi.fn());
    expect(tried.current).toBeNull();
    await syncFee(tried, area, true, choose, vi.fn());
    expect(choose).toHaveBeenCalledTimes(2);
  });

  it("says nothing to the shopper when the shop cannot re-price, and still reloads nothing", async () => {
    const getCart = vi.fn();
    const result = await syncFee(ref(), area, true, async () => { throw new Error("no"); }, getCart);
    expect(result).toBe("done");
    expect(getCart).not.toHaveBeenCalled();
  });

  it("keeps others waiting until the cart has been reloaded too, not just until the fee is saved", async () => {
    let reloaded = () => {};
    const getCart = vi.fn(() => new Promise<void>((resolve) => { reloaded = resolve; }));
    const first = syncFee(ref(), area, true, async () => {}, getCart);
    await Promise.resolve();
    await Promise.resolve();
    expect(await syncFee(ref(), area, false, vi.fn(async () => {}), vi.fn())).toBe("busy");
    reloaded();
    await first;
  });

  it("lets only one re-pricing run at a time, across the cart page and the pop-up, and tells the other to wait", async () => {
    let release = () => {};
    const slow = vi.fn(() => new Promise<void>((resolve) => { release = resolve; }));
    const first = syncFee(ref(), area, true, slow, vi.fn());
    const other = await syncFee(ref(), area, false, vi.fn(async () => {}), vi.fn());
    expect(other).toBe("busy");
    release();
    await first;
    await whenFeeSyncIdle();
    expect(await syncFee(ref(), area, false, vi.fn(async () => {}), vi.fn())).toBe("done");
  });
});
