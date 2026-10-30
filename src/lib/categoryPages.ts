import type { FetchLike } from "@/lib/storeProducts";

// A category of the store as a page of its own: /shop/<slug>, with the title and description the shop wrote for it in Wix.
// The categories come from the store's category tree, which carries the SEO title and description that the older category call leaves out.
// Docs: https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/categories/query-categories
export const CATEGORIES_QUERY_URL = "https://www.wixapis.com/categories/v1/categories/query";

// The store's own "All Products" category is the whole shop, which has its own plain address.
export const ALL_PRODUCTS_SLUG = "all-products";

export type CategoryPage = {
  id: string;
  name: string;
  slug: string;
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type SeoTag = { type?: string; children?: string; props?: { name?: string; content?: string }; disabled?: boolean };
type WixCategory = { id?: string; name?: string; slug?: string; description?: string; seoData?: { tags?: SeoTag[] } };

export const seoOf = (tags: SeoTag[] | undefined): { title: string | null; description: string | null } => {
  const live = (tags ?? []).filter((t) => !t.disabled);
  const title = live.find((t) => t.type === "title")?.children?.trim();
  const description = live.find((t) => t.type === "meta" && t.props?.name === "description")?.props?.content?.trim();
  return { title: title || null, description: description || null };
};

// The categories the store shows. Throws when the store cannot be read, so a page never calls a real category missing.
export const loadCategoryPages = async (fetchLike: FetchLike): Promise<CategoryPage[]> => {
  const response = await fetchLike(CATEGORIES_QUERY_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    // The store sends a description only when asked for it, and at most 1,000 categories a request.
    body: JSON.stringify({ query: { cursorPaging: { limit: 1000 } }, fields: ["DESCRIPTION"], treeReference: { appNamespace: "@wix/stores", treeKey: null } }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !Array.isArray(json?.categories)) {
    throw new Error(`Wix categories could not be read: ${response.status}`);
  }
  return (json.categories as WixCategory[]).flatMap((c) => {
    if (!c.id || !c.name || !c.slug) return [];
    const seo = seoOf(c.seoData?.tags);
    return [{ id: c.id, name: c.name.trim(), slug: c.slug, description: (c.description ?? "").trim(), seoTitle: seo.title, seoDescription: seo.description }];
  });
};

export const findCategory = (categories: CategoryPage[], slug: string): CategoryPage | undefined =>
  slug ? categories.find((c) => c.slug === slug) : undefined;

export const categoryHref = (slug: string): string => (slug === ALL_PRODUCTS_SLUG ? "/shop" : `/shop/${slug}`);

// The title the shop wrote for search engines is used as written (it already carries the shop's name); otherwise the category's name
// goes through the site's title template.
export const categoryTitle = (category: CategoryPage): string | { absolute: string } =>
  category.seoTitle ? { absolute: category.seoTitle } : category.name;

export const categoryDescription = (category: CategoryPage): string =>
  category.seoDescription || category.description || `Shop ${category.name} at Watch Fusion Kenya, with delivery across Nairobi and Kenya.`;

type Query = Record<string, string | string[] | undefined>;

// The old address of a category page, /shop?cat=<slug>, and where it now lives. Every other option the shopper had comes along.
// The slug is encoded, so whatever is in the option can only ever lead to a page inside the shop.
export const legacyCategoryTarget = (params: Query): string | null => {
  if (!("cat" in params)) return null;
  const first = Array.isArray(params.cat) ? params.cat[0] : params.cat;
  const slug = (first ?? "").trim();
  const rest = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "cat" || value == null) continue;
    for (const v of Array.isArray(value) ? value : [value]) rest.append(key, v);
  }
  const path = !slug || slug === "." || slug === ".." || slug === ALL_PRODUCTS_SLUG || slug.length > 100 ? "/shop" : `/shop/${encodeURIComponent(slug)}`;
  const query = rest.toString();
  return query ? `${path}?${query}` : path;
};

const FILTER_KEYS = ["name", "min", "max", "sort", "type"];

// A search or a filter makes a page that search engines should not list: the plain category page is the one that should rank.
export const hasFilters = (params: Query): boolean =>
  FILTER_KEYS.some((key) => {
    const v = params[key];
    return (Array.isArray(v) ? v[0] : v)?.trim() ? true : false;
  });
