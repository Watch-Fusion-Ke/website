import type { ProductCard } from "@/lib/storeProducts";

// The header's search box asks the search page to open by sending this event, so the box and the page do not need to know each other.
export const OPEN_SEARCH_EVENT = "wf:open-search";

export const MIN_QUERY = 2;
export const MAX_QUERY = 60;
export const SUGGESTION_LIMIT = 6;

export const cleanQuery = (raw: string): string => raw.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY);
export const canSearch = (raw: string): boolean => cleanQuery(raw).length >= MIN_QUERY;

// Where Enter, or "See all results", goes: the shop's own results page.
export const shopSearchHref = (raw: string): string => `/shop?name=${encodeURIComponent(cleanQuery(raw))}`;

// Only what one line of the list needs, so the reply stays small.
export type Suggestion = Pick<ProductCard, "id" | "slug" | "name" | "imageUrl" | "priceLabel" | "compareAtLabel">;
export type SearchReply = { items: Suggestion[]; hasMore: boolean };

export const toSuggestion = (p: ProductCard): Suggestion => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  imageUrl: p.imageUrl,
  priceLabel: p.priceLabel,
  compareAtLabel: p.compareAtLabel,
});
