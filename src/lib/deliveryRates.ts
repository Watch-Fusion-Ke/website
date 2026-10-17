import type { DeliveryRate } from "@/lib/delivery";

// The Wix content collection that holds the delivery table. Mercy edits it in the Wix dashboard.
// Fields: title (the places on a rate, separated by "/"), road, price (number), isActive (switch).
export const DELIVERY_COLLECTION = "DeliveryRates";

const MAX_PRICE = 100000;

type Row = { _id?: string | null; data?: Record<string, unknown> | null };

// Turns rows of the collection into rates, skipping anything that is off, empty or not a sensible price.
export const parseRates = (rows: Row[]): DeliveryRate[] =>
  rows.flatMap((row) => {
    const data = row.data;
    if (!row._id || !data) return [];
    if (data.isActive === false) return [];
    const places = typeof data.title === "string" ? data.title.trim() : "";
    const price = Math.round(Number(String(data.price ?? "").replace(/,/g, "")));
    if (!places.replace(/[/,\s]/g, "") || !Number.isFinite(price) || price <= 0 || price > MAX_PRICE) return [];
    return [{ id: row._id, places, road: typeof data.road === "string" ? data.road.trim() : "", price }];
  });

type ItemsClient = {
  items: { query: (name: string) => { limit: (n: number) => { find: () => Promise<{ items: Row[] }> } } };
};

// Reads the table. Throws when the collection cannot be read, so the caller can tell "not set up" from "empty".
export const loadRates = async (client: ItemsClient): Promise<DeliveryRate[]> => {
  const result = await client.items.query(DELIVERY_COLLECTION).limit(500).find();
  return parseRates(result.items);
};
