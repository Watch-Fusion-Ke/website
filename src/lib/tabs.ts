export type TabKey = "home" | "gents" | "ladies" | "cart";

export type Tab = { key: TabKey; label: string; href: string };

// The phone tab bar. Gents and Ladies are the store's two main categories; everything else is in the menu. WhatsApp is the floating button, not a tab.
export const TABS: Tab[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "gents", label: "Gents", href: "/shop?cat=gents-watches" },
  { key: "ladies", label: "Ladies", href: "/shop?cat=ladies-watches" },
  { key: "cart", label: "Cart", href: "/cart" },
];

// Which tab matches the page the shopper is on.
export const activeTab = (pathname: string, cat: string | null): TabKey | null => {
  if (pathname === "/") return "home";
  if (pathname === "/cart" || pathname.startsWith("/cart/")) return "cart";
  if (pathname === "/shop") {
    if (cat === "gents-watches") return "gents";
    if (cat === "ladies-watches") return "ladies";
  }
  return null;
};
