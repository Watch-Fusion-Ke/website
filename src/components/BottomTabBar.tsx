"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCartStore } from "@/hooks/useCartStore";
import { TABS, activeTab, type TabKey } from "@/lib/tabs";
import { BagIcon, ChatIcon, HomeIcon, WatchRoundIcon, WatchSquareIcon } from "@/components/icons";

const ICONS: Record<TabKey, (props: { className?: string }) => JSX.Element> = {
  home: HomeIcon,
  gents: WatchSquareIcon,
  ladies: WatchRoundIcon,
  cart: BagIcon,
  chat: ChatIcon,
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
      className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => {
          const Icon = ICONS[tab.key];
          const active = current === tab.key;
          const className = `flex flex-col items-center justify-center gap-1 min-h-14 border-t-2 text-[11px] font-medium ${
            active ? "border-brand-gold text-black" : "border-transparent text-gray-500"
          }`;
          const content = (
            <>
              <span className="relative">
                <Icon className="w-6 h-6" />
                {tab.key === "cart" && counter > 0 && (
                  <span
                    data-cart-count={counter}
                    className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-yellow-400 text-gray-900 text-[10px] font-bold flex items-center justify-center"
                  >
                    {counter}
                  </span>
                )}
              </span>
              <span>{tab.label}</span>
            </>
          );

          return (
            <li key={tab.key}>
              {tab.external ? (
                <a href={tab.href} target="_blank" rel="noopener noreferrer" className={className}>
                  {content}
                </a>
              ) : (
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={tab.key === "cart" && counter > 0 ? `Cart, ${counter} items` : undefined}
                  className={className}
                >
                  {content}
                </Link>
              )}
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
