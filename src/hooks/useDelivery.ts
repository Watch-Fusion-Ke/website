"use client";

import { useEffect, useState } from "react";
import type { DeliveryArea } from "@/lib/delivery";

type State = { enabled: boolean; areas: DeliveryArea[]; loaded: boolean };

// The delivery areas offered by the shop, and the two actions on a cart: set an area and clear it.
// When the server says delivery fees are off, `enabled` stays false and the cart page works as it always did.
const useDelivery = () => {
  const [state, setState] = useState<State>({ enabled: false, areas: [], loaded: false });

  useEffect(() => {
    let live = true;
    fetch("/api/delivery")
      .then((r) => (r.ok ? r.json() : { enabled: false, areas: [] }))
      .then((json) => live && setState({ enabled: Boolean(json.enabled), areas: json.areas ?? [], loaded: true }))
      .catch(() => live && setState({ enabled: false, areas: [], loaded: true }));
    return () => {
      live = false;
    };
  }, []);

  // Saves the chosen area on the shopper's cart. Throws a message the shopper can read when it fails.
  const choose = async (area: DeliveryArea): Promise<void> => {
    const response = await fetch("/api/delivery", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ areaId: area.id }),
    });
    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      throw new Error(json.error ?? "We could not save that. Please try again.");
    }
  };

  const clear = async (): Promise<void> => {
    await fetch("/api/delivery", { method: "DELETE" }).catch(() => {});
  };

  return { ...state, choose, clear };
};

export default useDelivery;
