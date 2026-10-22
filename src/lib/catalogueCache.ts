import type { FetchLike } from "@/lib/storeProducts";

// The search reads the whole product list and matches the typed words itself, so a run of keystrokes would read the same list again and
// again. This keeps each distinct request's good answer for a minute, so the shop's Wix account is asked once, not once per letter.
const KEEP_MS = 60_000;
const MAX_ENTRIES = 20;
const kept = new Map<string, { at: number; text: string }>();

export const clearCatalogueCache = () => kept.clear();

export const cachedFetch =
  (fetchLike: FetchLike, now: () => number = Date.now): FetchLike =>
  async (url, init) => {
    const key = `${url}\n${typeof init?.body === "string" ? init.body : ""}`;
    const hit = kept.get(key);
    if (hit && now() - hit.at < KEEP_MS) return new Response(hit.text, { status: 200, headers: { "content-type": "application/json" } });
    const response = await fetchLike(url, init);
    if (!response.ok) return response;
    const text = await response.text();
    if (kept.size >= MAX_ENTRIES) kept.clear();
    kept.set(key, { at: now(), text });
    return new Response(text, { status: 200, headers: { "content-type": "application/json" } });
  };
