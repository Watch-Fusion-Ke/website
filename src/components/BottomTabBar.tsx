"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCartStore } from "@/hooks/useCartStore";
import { TABS, activeTab, type TabKey } from "@/lib/tabs";
import { TabBagIcon, TabGentsIcon, TabHomeIcon, TabLadiesIcon } from "@/components/icons";

const ICONS: Record<TabKey, (props: { className?: string }) => JSX.Element> = {
  home: TabHomeIcon,
  gents: TabGentsIcon,
  ladies: TabLadiesIcon,
  cart: TabBagIcon,
};

// Main navigation on phones: a rounded navy dock that floats just above the bottom edge, like a shopping app.
// The navy is the shop's brand navy written out, because the dark theme restyles the "bg-brand-navy" class as an outline.
export const TabBarView = ({
  pathname,
  cat,
  counter,
}: {
  pathname: string;
  cat: string | null;
  counter: number;
}) => {
  const current = activeTab(pathname, cat);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] md:hidden">
      <nav
        aria-label="Main"
        className="pointer-events-auto mx-auto max-w-md rounded-[1.75rem] bg-[#1E2235] px-1.5 shadow-[0_12px_32px_-10px_rgba(0,0,0,0.55)] ring-1 ring-white/10 dark:ring-brand-gold/25"
      >
        <ul className="grid grid-cols-4">
          {TABS.map((tab) => {
            const Icon = ICONS[tab.key];
            const active = current === tab.key;
            return (
              <li key={tab.key}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={tab.key === "cart" && counter > 0 ? `Cart, ${counter} items` : undefined}
                  className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${
                    active ? "text-brand-gold" : "text-white/60 active:text-white"
                  }`}
                >
                  <span className={`relative flex h-8 w-14 items-center justify-center rounded-full transition-colors ${active ? "bg-brand-gold/15" : ""}`}>
                    <Icon className="h-6 w-6" />
                    {tab.key === "cart" && counter > 0 && (
                      <span
                        data-cart-count={counter}
                        className="absolute -top-0.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-gold px-1 text-[10px] font-bold text-gray-900 ring-2 ring-[#1E2235]"
                      >
                        {counter}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em]">{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

// Reads the current page and the cart count. The cart is loaded into the store by NavIcons on every page.
const BottomTabBar = () => {
  const pathname = usePathname();
  const cat = useSearchParams()?.get("cat") ?? null;
  const { counter } = useCartStore();
  return <TabBarView pathname={pathname} cat={cat} counter={counter} />;
};

export default BottomTabBar;
