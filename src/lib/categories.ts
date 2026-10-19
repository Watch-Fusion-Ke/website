export type Category = { _id?: string | null; name?: string | null; slug?: string | null };
export type CategoryLink = { name: string; slug: string };

// The store's own "All Products" category is the whole shop, which the pages already link to by themselves.
export const isAllProducts = (slug?: string | null) => slug === "all-products";

// The categories worth a link: named, with an address, not the whole-shop one, at most `max` of them.
export const pickCategories = (items: Category[], max: number): CategoryLink[] =>
  items
    .filter((c) => c.name && c.slug && !isAllProducts(c.slug))
    .map((c) => ({ name: c.name as string, slug: c.slug as string }))
    .slice(0, max);

// Asks the shop for its categories once and hands the same answer to everything that wants it,
// so the footer and the menu cost one request together. A failed attempt is not kept, so the next call tries again.
export const createCategoryLoader = (fetchItems: () => Promise<Category[]>) => {
  let pending: Promise<Category[]> | null = null;
  return (): Promise<Category[]> => {
    if (!pending) {
      pending = fetchItems().catch(() => {
        pending = null;
        return [];
      });
    }
    return pending;
  };
};
