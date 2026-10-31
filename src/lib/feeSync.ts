import { feeToRefresh, type DeliveryArea } from "@/lib/delivery";

// Delivery is free from a set amount of goods, so the fee already in the cart goes stale when the basket crosses that line in either
// direction. This prices the chosen area again and reloads the cart. Each mismatch is tried once, so a fee that will not change cannot
// make the page ask again and again, and only one re-pricing runs at a time across the cart page and the cart pop-up. A failure is
// silent: the fee simply stays as it was.
let running: Promise<void> | null = null;

export const whenFeeSyncIdle = async (): Promise<void> => {
  while (running) await running;
};

export const syncFee = async (
  tried: { current: string | null },
  area: DeliveryArea | null,
  free: boolean,
  choose: (area: DeliveryArea) => Promise<void>,
  getCart: () => unknown // may return a promise; the next run waits for it
): Promise<"skipped" | "busy" | "done"> => {
  if (!area) {
    tried.current = null;
    return "skipped";
  }
  const key = `${area.id}:${free}`;
  if (tried.current === key) return "skipped";
  if (running) return "busy";
  tried.current = key;
  const job = choose(area)
    .then(async () => {
      await getCart();
    })
    .catch(() => {});
  running = job;
  await job;
  if (running === job) running = null;
  return "done";
};

// The last look before checkout opens. The fee is also re-priced by itself whenever the basket crosses the free-delivery line, but a
// shopper who removes an item and taps Checkout at once can get ahead of that. This waits for any re-pricing that is running, looks
// again, and prices the fee once more if it is still out of step. A failure is silent, so the shopper is never stopped from paying.
export const ensureFeeMatchesBasket = async ({
  getLines,
  areas,
  choose,
  getCart,
}: {
  getLines: () => Parameters<typeof feeToRefresh>[0];
  areas: DeliveryArea[];
  choose: (area: DeliveryArea) => Promise<void>;
  getCart: () => unknown;
}): Promise<void> => {
  if (!feeToRefresh(getLines(), areas)) return;
  await whenFeeSyncIdle();
  const area = feeToRefresh(getLines(), areas);
  if (!area) return;
  try {
    await choose(area);
    await getCart();
  } catch {
    // leave the fee as it is
  }
};
