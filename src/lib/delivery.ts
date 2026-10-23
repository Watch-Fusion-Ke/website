// Delivery areas and their fees. The shop's own table of rates (kept in Wix, where the shop edits it) has one
// row per rate: "UNEP / GIGIRI / VILLAGE MARKET", a road and a price. The picker turns each place on a row
// into its own searchable area.

export type DeliveryRate = { id: string; places: string; road: string; price: number };
export type DeliveryArea = { id: string; place: string; road: string; price: number };

// Every delivery line in a cart is named "Delivery: place, road", which is how the site recognises it.
export const DELIVERY_PREFIX = "Delivery: ";

export const deliveryLineName = (area: Pick<DeliveryArea, "place" | "road">): string =>
  `${DELIVERY_PREFIX}${area.place}${area.road ? `, ${area.road}` : ""}`;

export const isDeliveryLine = (item: { productName?: { original?: string | null } | null }): boolean =>
  (item.productName?.original ?? "").startsWith(DELIVERY_PREFIX);

// Delivery is free when the goods in the basket come to more than this many shillings (exactly this much still pays).
export const FREE_DELIVERY_ABOVE = 10000;

export const isFreeDelivery = (goods: number): boolean => Number.isFinite(goods) && goods > FREE_DELIVERY_ABOVE;

type PricedLine = { price?: { amount?: string | null } | null; quantity?: number | null };

// What the shopper is paying for the goods themselves: each product's price times its quantity. Pass products only, never the delivery line.
// A line whose price or quantity cannot be read is left out, so a fault makes delivery cost money rather than giving it away.
export const goodsTotal = (lines: PricedLine[]): number =>
  lines.reduce((sum, line) => {
    const price = Number(line.price?.amount);
    const quantity = Number(line.quantity);
    return Number.isFinite(price) && Number.isFinite(quantity) && line.price?.amount != null && line.quantity != null ? sum + price * quantity : sum;
  }, 0);

// With delivery fees on, a cart cannot go to checkout until it holds a delivery line.
// If the shop could not add the fee (`unavailable`), checkout is let through so a fault never stops a sale.
export const needsDeliveryArea = (
  enabled: boolean,
  lines: { productName?: { original?: string | null } | null }[],
  unavailable = false
): boolean => enabled && !unavailable && !lines.some(isDeliveryLine);

// The delivery area to price again, when the fee in the cart no longer matches the basket: charged although the goods now qualify,
// or free although they no longer do. Nothing when there is nothing to fix, or when the shop cannot tell which area the line is for.
export const feeToRefresh = (
  lines: (PricedLine & { productName?: { original?: string | null } | null })[],
  areas: DeliveryArea[]
): DeliveryArea | null => {
  const line = lines.find(isDeliveryLine);
  const products = lines.filter((l) => !isDeliveryLine(l));
  if (!line || products.length === 0) return null;
  const area = areas.find((a) => deliveryLineName(a) === line.productName?.original);
  const charged = Number(line.price?.amount);
  if (!area || line.price?.amount == null || !Number.isFinite(charged)) return null;
  const expected = isFreeDelivery(goodsTotal(products)) ? 0 : area.price;
  return charged !== expected ? area : null;
};

export const formatKes = (n: number): string => `KES ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const toTitleCase = (s: string) => s.toLowerCase().replace(/(^|[\s(-])([a-z])/g, (_, p, c) => p + c.toUpperCase());

// Trims, drops stray marks such as a leading "*", and writes shouting capitals in normal capitals.
const tidy = (raw: string): string => {
  const place = raw.replace(/^[*\s]+/, "").replace(/\s+/g, " ").trim();
  return place && place === place.toUpperCase() && /[A-Z]/.test(place) ? toTitleCase(place) : place;
};

export const areasFromRates = (rates: DeliveryRate[]): DeliveryArea[] =>
  rates.flatMap((rate) =>
    rate.places
      .split(/[/,]/)
      .map(tidy)
      .filter(Boolean)
      .map((place, index) => ({ id: `${rate.id}:${index}`, place, road: rate.road, price: rate.price }))
  );

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

// Areas that match what the shopper typed, best first: places starting with the typing, then places with a word
// that starts with it, then places containing it, then matches on the road name only.
export const searchAreas = (areas: DeliveryArea[], query: string, limit = 8): DeliveryArea[] => {
  const q = normalise(query);
  if (q.length < 2) return [];
  const tokens = q.split(" ");

  const scored = areas.flatMap((area) => {
    const place = normalise(area.place);
    const road = normalise(area.road);
    const hay = `${place} ${road}`;
    if (!tokens.every((t) => hay.includes(t))) return [];
    let score = 4;
    if (place === q) score = 0;
    else if (place.startsWith(q)) score = 1;
    else if (place.split(" ").some((w) => w.startsWith(tokens[0]))) score = 2;
    else if (tokens.every((t) => place.includes(t))) score = 3;
    return [{ area, score }];
  });

  return scored
    .sort((a, b) => a.score - b.score || a.area.place.localeCompare(b.area.place) || a.area.road.localeCompare(b.area.road))
    .slice(0, limit)
    .map((s) => s.area);
};
