"use client";

import { useCallback, useEffect, useState } from "react";
import type { DeliveryArea } from "@/lib/delivery";

type State = { enabled: boolean; areas: DeliveryArea[]; loaded: boolean; unavailable: boolean };

// The delivery areas offered by the shop, and the two actions on a cart: set an area and clear it.
// When the server says delivery fees are off, `enabled` stays false and the cart page works as it always did.
// When the shop could not add a fee (`unavailable`), the cart page lets the shopper check out anyway.
const useDelivery = () => {
  const [state, setState] = useState<State>({ enabled: false, areas: [], loaded: false, unavailable: false });

  useEffect(() => {
    let live = true;
    fetch("/api/delivery")
      .then((r) => (r.ok ? r.json() : { enabled: false, areas: [] }))
      .then((json) => live && setState((s) => ({ ...s, enabled: Boolean(json.enabled), areas: json.areas ?? [], loaded: true })))
      .catch(() => live && setState((s) => ({ ...s, enabled: false, areas: [], loaded: true })));
    return () => {
      live = false;
    };
  }, []);

  // Saves the chosen area on the shopper's cart. Throws a message the shopper can read when it fails.
  const choose = useCallback(async (area: DeliveryArea): Promise<void> => {
    let response: Response;
    try {
      response = await fetch("/api/delivery", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ areaId: area.id }),
      });
    } catch {
      setState((s) => ({ ...s, unavailable: true }));
      throw new Error("We could not reach the shop to add the delivery fee.");
    }
    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      if (json.unavailable || response.status >= 500) setState((s) => ({ ...s, unavailable: true }));
      throw new Error(json.error ?? "We could not save that. Please try again.");
    }
    setState((s) => ({ ...s, unavailable: false }));
  }, []);

  const clear = useCallback(async (): Promise<void> => {
    await fetch("/api/delivery", { method: "DELETE" }).catch(() => {});
  }, []);

  return { ...state, choose, clear };
};

export default useDelivery;
