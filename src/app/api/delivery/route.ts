import { NextResponse } from "next/server";
import { adminConfigured, adminFetch } from "@/lib/wixAdmin";
import { loadRates } from "@/lib/deliveryRates";
import { chooseDeliveryArea, clearDelivery, listDelivery, type DeliveryDeps } from "@/lib/deliveryService";
import { wixClientServer } from "@/lib/wixClientServer";

export const dynamic = "force-dynamic";

// The table changes rarely, so each server instance keeps it for a minute instead of asking Wix on every request.
let cachedRates: { at: number; rates: Awaited<ReturnType<typeof loadRates>> } | null = null;
const RATES_TTL = 60_000;

// Each request makes several calls to Wix as the shop. One cart may ask for its fee a limited number of times a minute.
const WINDOW = 60_000;
const MAX_PER_WINDOW = 20;
const recent = new Map<string, number[]>();
const tooMany = (cartId: string, now = Date.now()): boolean => {
  const hits = (recent.get(cartId) ?? []).filter((t) => now - t < WINDOW);
  hits.push(now);
  recent.set(cartId, hits);
  if (recent.size > 5000) recent.forEach((v, k) => v.every((t) => now - t >= WINDOW) && recent.delete(k));
  return hits.length > MAX_PER_WINDOW;
};

const deps = async (): Promise<DeliveryDeps> => {
  const client = await wixClientServer();
  return {
    loadRates: async () => {
      if (cachedRates && Date.now() - cachedRates.at < RATES_TTL) return cachedRates.rates;
      const rates = await loadRates(client as unknown as Parameters<typeof loadRates>[0]);
      cachedRates = { at: Date.now(), rates };
      return rates;
    },
    getCartId: async () => {
      try {
        const cart = await client.currentCart.getCurrentCart();
        return cart?._id ?? null;
      } catch {
        return null; // the shopper has no cart yet
      }
    },
    adminFetch,
  };
};

// Only the shop's own pages may change a cart through this route.
const fromAnotherSite = (request: Request): boolean => {
  const origin = request.headers.get("origin");
  return origin !== null && origin !== new URL(request.url).origin;
};

// The delivery areas and fees, for the picker on the cart page. Kept for a minute so a price change shows soon.
export async function GET() {
  const result = await listDelivery(await deps(), adminConfigured());
  return NextResponse.json(result, { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

// Puts the chosen area's fee into the shopper's cart. The shopper sends an area id and never a price.
export async function POST(request: Request) {
  if (fromAnotherSite(request)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  if (!adminConfigured()) return NextResponse.json({ error: "Delivery fees are not available right now." }, { status: 503 });

  let areaId: unknown;
  try {
    areaId = (await request.json())?.areaId;
  } catch {
    return NextResponse.json({ error: "Choose a delivery area." }, { status: 400 });
  }
  const d = await deps();
  const cartId = await d.getCartId();
  if (cartId && tooMany(cartId)) {
    return NextResponse.json({ error: "Too many tries. Please wait a minute." }, { status: 429 });
  }
  const result = await chooseDeliveryArea({ ...d, getCartId: async () => cartId }, areaId);
  return NextResponse.json(result.body, { status: result.status });
}

// Takes the delivery fee out of the shopper's cart.
export async function DELETE(request: Request) {
  if (fromAnotherSite(request)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  if (!adminConfigured()) return NextResponse.json({}, { status: 200 });
  const result = await clearDelivery(await deps());
  return NextResponse.json(result.body, { status: result.status });
}
