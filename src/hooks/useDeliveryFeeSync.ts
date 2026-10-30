"use client";

import { useEffect, useRef, useState } from "react";
import { feeToRefresh, goodsTotal, isDeliveryLine, isFreeDelivery, type DeliveryArea } from "@/lib/delivery";
import { syncFee, whenFeeSyncIdle } from "@/lib/feeSync";

type Line = Parameters<typeof feeToRefresh>[0][number];

// Keeps the delivery fee in the cart in step with the basket (see feeSync). Used wherever a checkout can start.
const useDeliveryFeeSync = (
  lines: Line[],
  delivery: { enabled: boolean; loaded: boolean; areas: DeliveryArea[]; choose: (area: DeliveryArea) => Promise<void> },
  getCart: () => unknown
) => {
  const tried = useRef<string | null>(null);
  const [again, setAgain] = useState(0);
  const { enabled, loaded, areas, choose } = delivery;
  const area = enabled && loaded ? feeToRefresh(lines, areas) : null;
  const free = isFreeDelivery(goodsTotal(lines.filter((l) => !isDeliveryLine(l))));

  useEffect(() => {
    let live = true;
    syncFee(tried, area, free, choose, getCart).then((result) => {
      // Another re-pricing was running: look again once it has finished.
      if (result === "busy") whenFeeSyncIdle().then(() => live && setAgain((n) => n + 1));
    });
    return () => {
      live = false;
    };
  }, [area, free, choose, getCart, again]);
};

export default useDeliveryFeeSync;
