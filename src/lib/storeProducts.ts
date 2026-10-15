// Product listing for the live store, which runs Wix Stores Catalog V3.
// The older products query (Catalog V1) rejects the category and price filters on a V3 store,
// so listing goes through the V3 product search instead.
// Docs: https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/products-v3/search-products

export const PRODUCTS_SEARCH_URL = "https://www.wixapis.com/stores/v3/products/search";

// One search call returns up to 100 products. The store has 48. Paging happens in memory,
// so a store with more than 100 matching products would need cursor paging added here.
const SEARCH_LIMIT = 100;
const DEFAULT_PAGE_SIZE = 20;

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

// Values from the page's query string. Next.js hands over an array when a key is repeated.
type QueryValue = string | string[] | number | undefined;

export type ProductListParams = {
  categoryId?: string;
  name?: QueryValue;
  type?: QueryValue;
  min?: QueryValue;
  max?: QueryValue;
  sort?: QueryValue;
  page?: QueryValue;
  limit?: number;
};

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  hoverImageUrl: string | null;
  priceLabel: string;
};

export type ProductPage = {
  items: ProductCard[];
  page: number;
  hasPrev: boolean;
  hasNext: boolean;
};

type Condition = Record<string, unknown>;

export type SearchBody = {
  search: {
    filter?: { $and: Condition[] };
    sort?: { fieldName: string; order: "ASC" | "DESC" }[];
    cursorPaging: { limit: number };
  };
  fields: string[];
};

const PRICE_FIELD = "actualPriceRange.minValue.amount";

const SORT_FIELDS: Record<string, string> = {
  price: PRICE_FIELD,
  lastUpdated: "updatedDate",
  name: "name",
};

const PRODUCT_TYPES: Record<string, string> = {
  physical: "PHYSICAL",
  digital: "DIGITAL",
};

const has = (table: Record<string, string>, key: string) =>
  Object.prototype.hasOwnProperty.call(table, key);

// A repeated query key (?name=a&name=b) arrives as an array: use the first value.
const asText = (value: QueryValue): string | undefined => {
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first === "number") return String(first);
  return typeof first === "string" ? first : undefined;
};

// Accepts "1000", "1,000" and " 1000 "; anything else is not a price.
const asNumberString = (value: QueryValue): string | null => {
  const text = asText(value)?.replace(/[,\s]/g, "");
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? String(n) : null;
};

export const buildSearchBody = (params: ProductListParams): SearchBody => {
  const conditions: Condition[] = [];

  if (params.categoryId) {
    conditions.push({
      "allCategoriesInfo.categories": {
        $matchItems: [{ id: { $eq: params.categoryId } }],
      },
    });
  }

  const name = asText(params.name)?.trim();
  if (name) conditions.push({ name: { $startsWith: name } });

  const typeKey = asText(params.type)?.toLowerCase() ?? "";
  if (has(PRODUCT_TYPES, typeKey)) {
    conditions.push({ productType: { $eq: PRODUCT_TYPES[typeKey] } });
  }

  const min = asNumberString(params.min);
  if (min !== null) conditions.push({ [PRICE_FIELD]: { $gte: min } });

  const max = asNumberString(params.max);
  if (max !== null) conditions.push({ [PRICE_FIELD]: { $lte: max } });

  const body: SearchBody = {
    search: { cursorPaging: { limit: SEARCH_LIMIT } },
    fields: ["CURRENCY"],
  };
  if (conditions.length > 0) body.search.filter = { $and: conditions };

  const [direction, field = ""] = (asText(params.sort) ?? "").split(" ");
  if (has(SORT_FIELDS, field) && (direction === "asc" || direction === "desc")) {
    body.search.sort = [
      { fieldName: SORT_FIELDS[field], order: direction === "asc" ? "ASC" : "DESC" },
    ];
  }

  return body;
};

type WixProduct = {
  id: string;
  slug: string;
  name: string;
  actualPriceRange?: {
    minValue?: { amount?: string };
    maxValue?: { amount?: string };
  };
  media?: {
    main?: { image?: { url?: string } };
    itemsInfo?: { items?: { image?: { url?: string } }[] };
  };
};

const formatKes = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

const priceLabel = (product: WixProduct): string => {
  const min = Number(product.actualPriceRange?.minValue?.amount);
  if (!Number.isFinite(min)) return "";
  const max = Number(product.actualPriceRange?.maxValue?.amount);
  const prefix = Number.isFinite(max) && max > min ? "From " : "";
  return `${prefix}KES ${formatKes(min)}`;
};

const toCard = (product: WixProduct): ProductCard => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  imageUrl: product.media?.main?.image?.url ?? null,
  hoverImageUrl: product.media?.itemsInfo?.items?.[1]?.image?.url ?? null,
  priceLabel: priceLabel(product),
});

export const listProducts = async (
  fetchLike: FetchLike,
  params: ProductListParams
): Promise<ProductPage> => {
  const limit = params.limit && params.limit > 0 ? params.limit : DEFAULT_PAGE_SIZE;
  const page = Math.max(0, parseInt(asText(params.page) ?? "0", 10) || 0);

  const response = await fetchLike(PRODUCTS_SEARCH_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(buildSearchBody(params)),
  });
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const code = json?.details?.applicationError?.code ?? "no code";
    throw new Error(`Wix product search failed: ${response.status} ${code}: ${json?.message ?? "no message"}`);
  }

  // Wix returns "products": [] for an empty result, so a missing list means a bad response.
  if (!Array.isArray(json.products)) {
    throw new Error("Wix product search returned an unexpected response");
  }
  const all: WixProduct[] = json.products;
  const start = page * limit;
  return {
    items: all.slice(start, start + limit).map(toCard),
    page,
    hasPrev: page > 0,
    hasNext: start + limit < all.length,
  };
};
