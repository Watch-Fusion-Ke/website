import type { DeliveryArea } from "@/lib/delivery";

export type DeliveryOptions = { enabled: boolean; areas: DeliveryArea[] };

const OFF: DeliveryOptions = { enabled: false, areas: [] };
const TIMEOUT_MS = 5000;

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

// Asks the server whether delivery fees are on, and for the areas. Any trouble (an error, nonsense, no answer within
// five seconds) counts as "off", so a slow or broken answer can never keep a shopper from checking out.
export const loadDeliveryOptions = async (fetchImpl: FetchLike = fetch): Promise<DeliveryOptions> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchImpl("/api/delivery", { signal: controller.signal });
    if (!response.ok) return OFF;
    const json = await response.json();
    return { enabled: Boolean(json?.enabled), areas: Array.isArray(json?.areas) ? json.areas : [] };
  } catch {
    return OFF;
  } finally {
    clearTimeout(timer);
  }
};
