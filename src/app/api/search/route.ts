import { NextResponse } from "next/server";
import { wixClientServer } from "@/lib/wixClientServer";
import { listProducts } from "@/lib/storeProducts";
import { cachedFetch } from "@/lib/catalogueCache";
import { SUGGESTION_LIMIT, canSearch, cleanQuery, toSuggestion, type SearchReply } from "@/lib/productSearch";

export const dynamic = "force-dynamic";

// The reply is for one visitor and one word, so no shared cache keeps it; the browser may reuse it for half a minute while someone types.
const HEADERS = { "cache-control": "private, max-age=30" };

// One visitor may ask a few times a second while typing, but not without end.
const WINDOW = 60_000;
const MAX_PER_WINDOW = 60;
const recent = new Map<string, number[]>();
const tooMany = (key: string, now = Date.now()): boolean => {
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW);
  hits.push(now);
  recent.set(key, hits);
  if (recent.size > 5000) recent.forEach((v, k) => v.every((t) => now - t >= WINDOW) && recent.delete(k));
  return hits.length > MAX_PER_WINDOW;
};
const visitor = (request: Request): string => (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();

const empty: SearchReply = { items: [], hasMore: false };

export async function GET(request: Request) {
  const q = cleanQuery(new URL(request.url).searchParams.get("q") ?? "");
  if (!canSearch(q)) return NextResponse.json(empty, { headers: HEADERS });
  if (tooMany(visitor(request))) {
    return NextResponse.json({ error: "Too many searches. Please wait a moment." }, { status: 429 });
  }

  try {
    const wixClient = await wixClientServer();
    const page = await listProducts(cachedFetch((url, init) => wixClient.fetchWithAuth(url, init)), { name: q, limit: SUGGESTION_LIMIT });
    const reply: SearchReply = { items: page.items.map(toSuggestion), hasMore: page.hasNext };
    return NextResponse.json(reply, { headers: HEADERS });
  } catch (e) {
    console.error("search: product search failed", e);
    return NextResponse.json({ error: "The search is not available right now." }, { status: 502 });
  }
}
