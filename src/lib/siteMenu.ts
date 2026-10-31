// A brand can carry a few pages of its own, shown indented under it in the brands menu (Casio: Men and Women).
export type MenuCategory = { name: string; slug: string; visible?: boolean | null; children?: MenuCategory[] };
// A page of the site that is not a category (Deals, Contact). A menu can list some after its categories.
export type MenuPage = { name: string; href: string };
export type MenuGroup = { label: string; items: MenuCategory[]; pages?: MenuPage[] };
// One stop in the row: a plain link (a seasonal page is shown highlighted) or a menu that opens a dropdown.
export type RowEntry = { kind: "link"; category: MenuCategory; seasonal?: boolean } | { kind: "menu"; group: MenuGroup };
export type SiteMenu = { row: RowEntry[] };

// The site's own pages. The phone's menu drawer lists all of them; the row's More menu lists the ones it needs (see NOT_IN_MORE).
export const SITE_PAGES: MenuPage[] = [
  { name: "Homepage", href: "/" },
  { name: "Shop", href: "/shop" },
  { name: "Deals", href: "/deals" },
  { name: "Gift Vouchers", href: "/gift-vouchers" },
  { name: "Contact", href: "/contact" },
];
const SHOP_PAGE = "/shop";
// Left out of the More menu: the logo already goes home, and the footer already has Contact.
const NOT_IN_MORE = new Set(["/", "/contact"]);

// The shop's category row would otherwise print every Wix category side by side. These lists decide which ones stay in the row,
// which go into a menu, and where. The row reads: Watch Brands, Customizable Gifts, the seasonal pages, Gent's, Ladies, the other gift
// pages, then All Products, and the More menu at the very end. A category Wix does not send (a hidden one) never appears, and a category listed here that the store has
// not made visible simply is not there.
const LEFT_OUT = new Set(["all-products", "featured", "brands", "gifts"]); // each is handled on its own below, or is already covered by a home page section
const ALL_PRODUCTS = "all-products";
const BRANDS_PAGE = "brands";
const MAIN = ["gents-watches", "ladies-watches"];
const BRAND_ORDER = ["casio-watches-kenya", "naviforce-watches-kenya"];
// Only Casio has pages of its own (the shop asked for Men and Women under it, and said the other brands need none).
const BRAND_PAGES: Record<string, string[]> = { "casio-watches-kenya": ["casio-men", "casio-women"] };
const BRAND_PAGE_SLUGS = new Set(Object.keys(BRAND_PAGES).flatMap((brand) => BRAND_PAGES[brand]));
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

// A menu with one entry is just that entry (unless that entry has pages of its own to show), and a menu with none is not there.
const menuOrLink = (label: string, items: MenuCategory[]): RowEntry[] =>
  items.length > 1 || items.some((c) => c.children) ? [{ kind: "menu", group: { label, items } }] : items.map((category) => ({ kind: "link", category }));

export const buildMenu = (categories: MenuCategory[]): SiteMenu => {
  const shown = categories.filter((c) => c.slug && c.name && c.visible !== false && !LEFT_OUT.has(c.slug));
  const take = (test: (c: MenuCategory) => boolean) => shown.filter(test);
  const link = (c: MenuCategory, seasonal?: boolean): RowEntry => ({ kind: "link", category: c, seasonal });

  // The whole shop closes the row whenever the store shows its All Products page.
  const everything = categories.filter((c) => c.slug === ALL_PRODUCTS && c.name && c.visible !== false);
  const main = ordered(take((c) => MAIN.includes(c.slug)), MAIN);
  // The menu takes its name from the store's Watch Brands category, so renaming it in Wix renames the menu.
  const brandsLabel = categories.find((c) => c.slug === BRANDS_PAGE && c.name && c.visible !== false)?.name ?? "Brands";
  // A brand's own pages are listed under it, with the brand's name dropped from the front ("Casio Men" reads "Men").
  const withPages = (brand: MenuCategory): MenuCategory => {
    const wanted = BRAND_PAGES[brand.slug];
    if (!wanted) return brand;
    const pages = ordered(take((c) => wanted.includes(c.slug)), wanted).map((c) => ({
      name: c.name.replace(new RegExp(`^${brand.name.replace(/[^a-z0-9]/gi, "\\$&")}\\s+`, "i"), "") || c.name,
      slug: c.slug,
    }));
    return pages.length > 0 ? { ...brand, children: pages } : brand;
  };
  const brands = ordered(take((c) => isBrand(c.slug)), BRAND_ORDER).map(withPages);
  const giftEntry = take((c) => c.slug === GIFT_ENTRY);
  const seasonal = ordered(take((c) => SEASONAL.includes(c.slug)), SEASONAL);
  const rest = ordered(take((c) => !MAIN.includes(c.slug) && c.slug !== GIFT_ENTRY && !SEASONAL.includes(c.slug) && !isBrand(c.slug) && !BRAND_PAGE_SLUGS.has(c.slug)), OTHER_GIFT_ORDER);

  return {
    row: [
      ...menuOrLink(brandsLabel, brands),
      ...giftEntry.map((c) => link(c)),
      ...seasonal.map((c) => link(c, true)),
      ...main.map((c) => link(c)),
      ...everything.map((c) => link(c)),
      // One menu closes the row: any other gift pages the store has, then the site's own pages. Shop is listed only when the row has
      // no All Products entry, so the whole shop is always one click away and never shown twice.
      { kind: "menu", group: { label: "More", items: rest, pages: SITE_PAGES.filter((page) => !NOT_IN_MORE.has(page.href) && (page.href !== SHOP_PAGE || everything.length === 0)) } },
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

// Where to scroll a sliding row so one entry sits in the middle of what is visible. Never before the start or past the end, and a row that
// already fits (a computer) is not moved. Anything that is not a real size gives no movement.
export const centreScrollLeft = (itemLeft: number, itemWidth: number, viewWidth: number, contentWidth: number): number => {
  const furthest = contentWidth - viewWidth;
  if (![itemLeft, itemWidth, viewWidth, contentWidth].every(Number.isFinite) || furthest <= 0) return 0;
  return Math.min(furthest, Math.max(0, itemLeft + itemWidth / 2 - viewWidth / 2));
};

// Which ends of the row have more beyond them, to fade only those. `slack` is how far a row may be scrolled while hiding only empty
// space (the row's padding and an entry's own tap padding), and is at least a pixel, as scroll positions are fractions.
export const scrollEdges = (scrollLeft: number, viewWidth: number, contentWidth: number, slack = 1): { atStart: boolean; atEnd: boolean } => {
  const room = Math.max(1, slack);
  return { atStart: scrollLeft <= room, atEnd: scrollLeft >= contentWidth - viewWidth - room };
};

// The entry the phone row is built around: it opens centred in the row, and sits second, right after the first entry.
export const PHONE_FOCUS_SLUG = "christmas-gift-packages";

// Each entry's place in the phone row. The first entry stays first and the Christmas entry comes right after it, so a phone reads
// Watch Brands, Christmas, Customizable Gifts, and the Christmas entry lands in the middle of the screen with its neighbours either side.
// Everything else keeps its usual order. This sets only the order on screen: a computer's row, and the order in the page, are left alone.
export const phoneOrder = (row: RowEntry[]): number[] => {
  const places = row.map((_, i) => i);
  const focus = row.findIndex((e) => e.kind === "link" && e.category.slug === PHONE_FOCUS_SLUG);
  if (focus <= 1) return places;
  return places.map((i) => (i === focus ? 1 : i > 0 && i < focus ? i + 1 : i));
};

// A menu that holds only the site's own pages, with no category: on a phone it is left out, because the phone's menu drawer has them.
export const pagesOnly = (group: MenuGroup): boolean => group.items.length === 0 && Boolean(group.pages && group.pages.length > 0);

// The right edge of the last entry of the row that is really shown. An entry that is not shown has no size, so it is skipped: measuring
// a hidden one would give a dropdown a limit of zero. `fallback` is used when nothing is shown.
export const lastVisibleRight = (boxes: { right: number; width: number }[], fallback: number): number => {
  for (let i = boxes.length - 1; i >= 0; i--) {
    if (boxes[i].width > 0) return boxes[i].right;
  }
  return fallback;
};
