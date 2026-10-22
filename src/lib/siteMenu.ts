export type MenuCategory = { name: string; slug: string; visible?: boolean | null };
export type MenuGroup = { label: string; items: MenuCategory[] };
// One stop in the row: a plain link (a seasonal page is shown highlighted) or a menu that opens a dropdown.
export type RowEntry = { kind: "link"; category: MenuCategory; seasonal?: boolean } | { kind: "menu"; group: MenuGroup };
export type SiteMenu = { row: RowEntry[] };

// The shop's category row would otherwise print every Wix category side by side. These lists decide which ones stay in the row,
// which go into a menu, and where. The row reads: All Products, Gent's, Ladies, Watch Brands, Customizable Gifts, the seasonal pages,
// then the other gift pages. A category Wix does not send (a hidden one) never appears, and a category listed here that the store has
// not made visible simply is not there.
const LEFT_OUT = new Set(["all-products", "featured", "brands", "gifts"]); // each is handled on its own below, or is already covered by a home page section
const ALL_PRODUCTS = "all-products";
const BRANDS_PAGE = "brands";
const MAIN = ["gents-watches", "ladies-watches"];
const BRAND_ORDER = ["casio-watches-kenya", "naviforce-watches-kenya"];
const GIFT_ENTRY = "customizable-gifts";
const OTHER_GIFT_ORDER = ["gift-packages", "birthday-gifts", "corporate-gifts"];
const SEASONAL = ["christmas-gift-packages", "valentines-gifts"];

const isBrand = (slug: string) => slug.endsWith("-watches-kenya");

// Items named in `order` come first, in that order; the rest follow in the order the store sent them.
const ordered = (items: MenuCategory[], order: string[]) => {
  const rank = (slug: string) => {
    const i = order.indexOf(slug);
    return i === -1 ? order.length : i;
  };
  return items.map((item, at) => ({ item, at })).sort((a, b) => rank(a.item.slug) - rank(b.item.slug) || a.at - b.at).map((x) => x.item);
};

// A menu with one entry is just that entry, and a menu with none is not there.
const menuOrLink = (label: string, items: MenuCategory[]): RowEntry[] =>
  items.length > 1 ? [{ kind: "menu", group: { label, items } }] : items.map((category) => ({ kind: "link", category }));

export const buildMenu = (categories: MenuCategory[]): SiteMenu => {
  const shown = categories.filter((c) => c.slug && c.name && c.visible !== false && !LEFT_OUT.has(c.slug));
  const take = (test: (c: MenuCategory) => boolean) => shown.filter(test);
  const link = (c: MenuCategory, seasonal?: boolean): RowEntry => ({ kind: "link", category: c, seasonal });

  // The whole shop leads the row whenever the store shows its All Products page.
  const everything = categories.filter((c) => c.slug === ALL_PRODUCTS && c.name && c.visible !== false);
  const main = [...everything, ...ordered(take((c) => MAIN.includes(c.slug)), MAIN)];
  // The menu takes its name from the store's Watch Brands category, so renaming it in Wix renames the menu.
  const brandsLabel = categories.find((c) => c.slug === BRANDS_PAGE && c.name && c.visible !== false)?.name ?? "Brands";
  const brands = ordered(take((c) => isBrand(c.slug)), BRAND_ORDER);
  const giftEntry = take((c) => c.slug === GIFT_ENTRY);
  const seasonal = ordered(take((c) => SEASONAL.includes(c.slug)), SEASONAL);
  const rest = ordered(take((c) => !MAIN.includes(c.slug) && c.slug !== GIFT_ENTRY && !SEASONAL.includes(c.slug) && !isBrand(c.slug)), OTHER_GIFT_ORDER);

  return {
    row: [
      ...main.map((c) => link(c)),
      ...menuOrLink(brandsLabel, brands),
      ...giftEntry.map((c) => link(c)),
      ...seasonal.map((c) => link(c, true)),
      ...menuOrLink("More", rest),
    ],
  };
};

// Which menu is open, and whether a click has pinned it. A menu opened by hovering closes when the pointer leaves; once clicked it stays
// until it is clicked again, another is opened, or the shopper presses somewhere else.
export type MenuState = { open: string | null; pinned: boolean };
export const closed: MenuState = { open: null, pinned: false };
export const hoverIn = (state: MenuState, label: string): MenuState => ({ open: label, pinned: state.pinned && state.open !== null });
export const hoverOut = (state: MenuState): MenuState => (state.pinned ? state : closed);
export const press = (state: MenuState, label: string): MenuState => (state.open === label && state.pinned ? closed : { open: label, pinned: true });

// Where a dropdown starts so it lines up with its button but never runs past the right edge or off the left edge.
export const clampLeft = (buttonLeft: number, panelWidth: number, containerWidth: number) =>
  Math.max(0, Math.min(buttonLeft, containerWidth - panelWidth));
