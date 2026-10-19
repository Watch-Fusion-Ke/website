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

// Main navigation along the bottom of the screen on phones, like a shopping app.
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
    <nav
      aria-label="Main"
      className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const Icon = ICONS[tab.key];
          const active = current === tab.key;
          const className = `relative flex min-h-14 flex-col items-center justify-center gap-0.5 pt-1 ${
            active ? "text-brand-navy" : "text-gray-500"
          }`;
          const content = (
            <>
              {active && (
                <span aria-hidden="true" className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-gold" />
              )}
              <span className={`relative flex h-7 w-12 items-center justify-center rounded-full ${active ? "bg-brand-gold/15" : ""}`}>
                <Icon className="h-[22px] w-[22px]" />
                {tab.key === "cart" && counter > 0 && (
                  <span
                    data-cart-count={counter}
                    className="absolute -top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-gold px-1 text-[10px] font-bold text-gray-900"
                  >
                    {counter}
                  </span>
                )}
              </span>
              <span className={`text-[10px] uppercase tracking-[0.08em] ${active ? "font-bold" : "font-medium"}`}>{tab.label}</span>
            </>
          );

          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                aria-label={tab.key === "cart" && counter > 0 ? `Cart, ${counter} items` : undefined}
                className={className}
              >
                {content}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
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
