"use client";

import { useEffect, useRef } from "react";
import { feeToRefresh, goodsTotal, isDeliveryLine, isFreeDelivery, type DeliveryArea } from "@/lib/delivery";

type Line = Parameters<typeof feeToRefresh>[0][number];

// Delivery is free above a set amount of goods, so the fee already in the cart goes stale when the basket crosses that line in either
// direction (an item added from a product page, or removed here). This asks the shop to price the chosen area again, then reloads the cart.
// Each mismatch is tried once, so a fee that will not change cannot make the page keep asking. The checkout still uses whatever the
// cart holds, and the shopper is never shown an error for this: a failed attempt just leaves the fee as it was.
const useDeliveryFeeSync = (
  lines: Line[],
  delivery: { enabled: boolean; loaded: boolean; areas: DeliveryArea[]; choose: (area: DeliveryArea) => Promise<void> },
  getCart: () => unknown
) => {
  const tried = useRef<string | null>(null);
  const { enabled, loaded, areas, choose } = delivery;
  const area = enabled && loaded ? feeToRefresh(lines, areas) : null;
  const free = isFreeDelivery(goodsTotal(lines.filter((l) => !isDeliveryLine(l))));

  useEffect(() => {
    if (!area) {
      tried.current = null;
      return;
    }
    const key = `${area.id}:${free}`;
    if (tried.current === key) return;
    tried.current = key;
    choose(area)
      .then(() => getCart())
      .catch(() => {});
  }, [area, free, choose, getCart]);
};

export default useDeliveryFeeSync;
