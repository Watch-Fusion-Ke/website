export type MenuCategory = { name: string; slug: string; visible?: boolean | null };
export type MenuGroup = { label: string; items: MenuCategory[] };
export type SiteMenu = { primary: MenuCategory[]; groups: MenuGroup[]; seasonal: MenuCategory[] };

// The shop's category row would otherwise print every Wix category side by side. These lists decide which ones stay in the row,
// which go into a menu, and where. A category Wix does not send (a hidden one) never appears, and a category listed here that the
// store has not made visible simply is not there.
const LEFT_OUT = new Set(["all-products", "featured"]); // the Shop link and the Customer Favourites section already cover these
const MAIN = ["gents-watches", "ladies-watches"];
const BRAND_ORDER = ["casio-watches-kenya", "naviforce-watches-kenya"];
const GIFT_ORDER = ["gift-packages", "birthday-gifts", "corporate-gifts", "customizable-gifts"];
const SEASONAL = ["valentines-gifts", "christmas-gift-packages"];

const isBrand = (slug: string) => slug.endsWith("-watches-kenya");

// Items named in `order` come first, in that order; the rest follow in the order the store sent them.
const ordered = (items: MenuCategory[], order: string[]) => {
  const rank = (slug: string) => {
    const i = order.indexOf(slug);
    return i === -1 ? order.length : i;
  };
  return items.map((item, at) => ({ item, at })).sort((a, b) => rank(a.item.slug) - rank(b.item.slug) || a.at - b.at).map((x) => x.item);
};

export const buildMenu = (categories: MenuCategory[]): SiteMenu => {
  const shown = categories.filter((c) => c.slug && c.name && c.visible !== false && !LEFT_OUT.has(c.slug));
  const take = (test: (c: MenuCategory) => boolean) => shown.filter(test);

  const main = ordered(take((c) => MAIN.includes(c.slug)), MAIN);
  const seasonal = ordered(take((c) => SEASONAL.includes(c.slug)), SEASONAL);
  const brands = ordered(take((c) => isBrand(c.slug)), BRAND_ORDER);
  const gifts = ordered(take((c) => GIFT_ORDER.includes(c.slug)), GIFT_ORDER);
  const rest = take((c) => !MAIN.includes(c.slug) && !SEASONAL.includes(c.slug) && !isBrand(c.slug) && !GIFT_ORDER.includes(c.slug));

  const primary = [...main];
  const groups: MenuGroup[] = [];
  for (const group of [{ label: "Brands", items: brands }, { label: "Gifts", items: gifts }, { label: "More", items: rest }]) {
    if (group.items.length === 1) primary.push(group.items[0]); // a menu with one entry is just that entry
    else if (group.items.length > 1) groups.push(group);
  }
  return { primary, groups, seasonal };
};

// Pressing a menu opens it, pressing it again closes it, and pressing another one swaps to that one.
export const nextOpen = (current: string | null, pressed: string) => (current === pressed ? null : pressed);
