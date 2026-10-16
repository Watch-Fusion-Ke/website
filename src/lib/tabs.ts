import { WHATSAPP_URL } from "@/lib/contact";

export type TabKey = "home" | "gents" | "ladies" | "cart" | "chat";

export type Tab = { key: TabKey; label: string; href: string; external?: boolean };

// The phone tab bar. Gents and Ladies are the store's two main categories; everything else is in the menu.
export const TABS: Tab[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "gents", label: "Gents", href: "/list?cat=gents-watches" },
  { key: "ladies", label: "Ladies", href: "/list?cat=ladies-watches" },
  { key: "cart", label: "Cart", href: "/cart" },
  { key: "chat", label: "Chat", href: WHATSAPP_URL, external: true },
];

// Which tab matches the page the shopper is on. Chat leaves the site, so it is never current.
export const activeTab = (pathname: string, cat: string | null): TabKey | null => {
  if (pathname === "/") return "home";
  if (pathname === "/cart" || pathname.startsWith("/cart/")) return "cart";
  if (pathname === "/list" || pathname === "/shop") {
    if (cat === "gents-watches") return "gents";
    if (cat === "ladies-watches") return "ladies";
  }
  return null;
};
