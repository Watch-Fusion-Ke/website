export type TabKey = "home" | "shop" | "search" | "cart";

export type Tab = { key: TabKey; label: string; href?: string };

// Search opens a field above the dock; the other tabs navigate to pages.
export const TABS: Tab[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "shop", label: "Shop", href: "/shop" },
  { key: "search", label: "Search" },
  { key: "cart", label: "Cart", href: "/cart" },
];

// Which tab matches the page the shopper is on.
export const activeTab = (pathname: string, name: string | null): TabKey | null => {
  if (pathname === "/") return "home";
  if (pathname === "/cart" || pathname.startsWith("/cart/")) return "cart";
  if (pathname === "/shop") return name?.trim() ? "search" : "shop";
  return null;
};
