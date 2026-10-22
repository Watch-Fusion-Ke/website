"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { useCartStore } from "@/hooks/useCartStore";
import { TABS, activeTab, type TabKey } from "@/lib/tabs";
import { CloseIcon, TabBagIcon, TabHomeIcon, TabSearchIcon, TabShopIcon } from "@/components/icons";

const ICONS: Record<TabKey, (props: { className?: string }) => JSX.Element> = {
  home: TabHomeIcon,
  shop: TabShopIcon,
  search: TabSearchIcon,
  cart: TabBagIcon,
};

// Main navigation on phones: a rounded dock that floats just above the bottom edge, like a shopping app.
// It is deliberately not the brand navy of the Add to cart buttons, so the two do not compete: a warm white dock in the
// light theme, and a lifted navy dock with a fine gold edge in the dark theme, where a plain navy would vanish into the black page.
// The colours are written out because the dark theme restyles the "bg-brand-navy" and "text-brand-navy" classes.
export const TabBarView = ({
  pathname,
  name,
  counter,
  searchOpen = false,
  searchInputRef,
  searchButtonRef,
  onSearchToggle,
  onSearchClose,
  onSearchSubmit,
  onNavigate,
}: {
  pathname: string;
  name: string | null;
  counter: number;
  searchOpen?: boolean;
  searchInputRef?: RefObject<HTMLInputElement>;
  searchButtonRef?: RefObject<HTMLButtonElement>;
  onSearchToggle?: () => void;
  onSearchClose?: () => void;
  onSearchSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onNavigate?: () => void;
}) => {
  const current = searchOpen ? "search" : activeTab(pathname, name);

  const tabClass = (active: boolean) =>
    `relative flex min-h-14 w-full flex-col items-center justify-center gap-0.5 rounded-2xl py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${
      active ? "text-[#1E2235] dark:text-brand-gold" : "text-gray-600 active:text-[#1E2235] dark:active:text-white"
    }`;

  const tabContents = (tab: (typeof TABS)[number], active: boolean) => {
    const Icon = ICONS[tab.key];
    return <>
      <span className={`relative flex h-8 w-14 items-center justify-center rounded-full transition-colors ${active ? "bg-brand-gold/25 dark:bg-brand-gold/15" : ""}`}>
        <Icon className="h-6 w-6" />
        {tab.key === "cart" && counter > 0 && (
          <span
            data-cart-count={counter}
            className="absolute -top-0.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-gold px-1 text-[10px] font-bold text-gray-900 ring-2 ring-[#FFFDF8] dark:ring-[#1B1F33]"
          >
            {counter}
          </span>
        )}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em]">{tab.label}</span>
    </>;
  };

  return (
    <div className={`pointer-events-none fixed inset-x-0 bottom-0 ${searchOpen ? "z-40" : "z-30"} pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] md:hidden`}>
      {searchOpen && (
        <form
          id="phone-tab-search"
          role="search"
          onSubmit={onSearchSubmit}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onSearchClose?.();
            }
          }}
          className="pointer-events-auto mx-auto mb-2 max-w-md rounded-2xl bg-[#FFFDF8] p-4 shadow-[0_12px_32px_-10px_rgba(30,34,53,0.4)] ring-1 ring-black/15 dark:bg-[#1B1F33] dark:ring-brand-gold/40"
        >
          <div className="mb-3 flex items-center justify-between">
            <label htmlFor="phone-watch-search" className="font-semibold text-[#1E2235] dark:text-white">Search watches</label>
            <button type="button" onClick={onSearchClose} aria-label="Close search" className="rounded-full p-3 text-gray-600 focus-visible:ring-2 focus-visible:ring-brand-gold dark:text-white">
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex gap-2">
            <input ref={searchInputRef} id="phone-watch-search" name="name" type="search" defaultValue={name ?? ""} placeholder="e.g. MEGIR or NAVIFORCE" enterKeyHint="search" required className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-[#1E2235] outline-none focus-visible:ring-2 focus-visible:ring-brand-gold" />
            <button type="submit" className="rounded-lg bg-brand-navy px-4 py-2 font-semibold text-white focus-visible:ring-2 focus-visible:ring-brand-gold">Search</button>
          </div>
        </form>
      )}
      <nav
        aria-label="Main"
        className="pointer-events-auto mx-auto max-w-md rounded-[1.75rem] bg-[#FFFDF8] px-1.5 shadow-[0_12px_32px_-10px_rgba(30,34,53,0.4)] ring-1 ring-black/15 dark:bg-[#1B1F33] dark:shadow-[0_12px_32px_-10px_rgba(0,0,0,0.9)] dark:ring-brand-gold/40"
      >
        <ul className="grid grid-cols-4">
          {TABS.map((tab) => {
            const active = current === tab.key;
            return (
              <li key={tab.key}>
                {tab.key === "search" ? (
                  <button
                    ref={searchButtonRef}
                    type="button"
                    aria-controls={searchOpen ? "phone-tab-search" : undefined}
                    aria-expanded={searchOpen}
                    aria-current={active && !searchOpen ? "page" : undefined}
                    onClick={onSearchToggle}
                    className={tabClass(active)}
                  >
                    {tabContents(tab, active)}
                  </button>
                ) : (
                  <Link
                    href={tab.href!}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    aria-label={tab.key === "cart" && counter > 0 ? `Cart, ${counter} items` : undefined}
                    className={tabClass(active)}
                  >
                    {tabContents(tab, active)}
                  </Link>
                )}
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
  const searchParams = useSearchParams();
  const name = searchParams?.get("name") ?? null;
  const query = searchParams?.toString() ?? "";
  const router = useRouter();
  const { counter } = useCartStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => setSearchOpen(false), [pathname, query]);

  const closeSearch = () => {
    setSearchOpen(false);
    searchButtonRef.current?.focus();
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get("name")?.toString().trim();
    if (!query) return;
    setSearchOpen(false);
    router.push(`/shop?name=${encodeURIComponent(query)}`);
  };

  return <TabBarView pathname={pathname} name={name} counter={counter} searchOpen={searchOpen} searchInputRef={searchInputRef} searchButtonRef={searchButtonRef} onSearchToggle={() => setSearchOpen((open) => !open)} onSearchClose={closeSearch} onSearchSubmit={submitSearch} onNavigate={() => setSearchOpen(false)} />;
};

export default BottomTabBar;
