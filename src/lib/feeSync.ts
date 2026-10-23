import type { DeliveryArea } from "@/lib/delivery";

// Delivery is free above a set amount of goods, so the fee already in the cart goes stale when the basket crosses that line in either
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
  getCart: () => unknown
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
    .then(() => {
      getCart();
    })
    .catch(() => {});
  running = job;
  await job;
  if (running === job) running = null;
  return "done";
};
