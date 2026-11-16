import { describe, expect, it, vi } from "vitest";
import { ensureFeeMatchesBasket, syncFee, whenFeeSyncIdle } from "@/lib/feeSync";
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

describe("checking the fee one last time before checkout", () => {
  const gigiri: DeliveryArea = { id: "r1:0", place: "Gigiri", road: "Limuru Road", price: 450 };
  const watch = (amount: string, quantity = 1) => ({ productName: { original: "Watch" }, price: { amount }, quantity });
  const fee = (amount: string) => ({ productName: { original: "Delivery: Gigiri, Limuru Road" }, price: { amount }, quantity: 1 });

  it("prices the fee again when the basket crossed the free-delivery line since it was set, then reloads the cart", async () => {
    const choose = vi.fn(async () => {});
    const getCart = vi.fn();
    await ensureFeeMatchesBasket({ getLines: () => [watch("6500", 2), fee("450")], areas: [gigiri], choose, getCart });
    expect(choose).toHaveBeenCalledWith(gigiri);
    expect(getCart).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the fee already matches the basket", async () => {
    const choose = vi.fn(async () => {});
    await ensureFeeMatchesBasket({ getLines: () => [watch("6500"), fee("450")], areas: [gigiri], choose, getCart: vi.fn() });
    expect(choose).not.toHaveBeenCalled();
  });

  it("waits for a re-pricing that is already running, then checks again, so it never prices the same fee twice", async () => {
    let release = () => {};
    const slow = vi.fn(() => new Promise<void>((resolve) => { release = resolve; }));
    let lines: ReturnType<typeof fee | typeof watch>[] = [watch("6500", 2), fee("450")];
    const running = syncFee({ current: null }, gigiri, true, async () => { await slow(); lines = [watch("6500", 2), fee("0")]; }, vi.fn());
    const choose = vi.fn(async () => {});
    const waiting = ensureFeeMatchesBasket({ getLines: () => lines, areas: [gigiri], choose, getCart: vi.fn() });
    release();
    await running;
    await waiting;
    expect(choose).not.toHaveBeenCalled();
  });

  it("lets the shopper carry on, with the fee as it is, when the shop cannot re-price", async () => {
    const choose = vi.fn(async () => { throw new Error("no"); });
    await expect(ensureFeeMatchesBasket({ getLines: () => [watch("6500", 2), fee("450")], areas: [gigiri], choose, getCart: vi.fn() })).resolves.toBeUndefined();
  });
});
