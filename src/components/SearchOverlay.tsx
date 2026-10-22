"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { OPEN_SEARCH_EVENT, canSearch, cleanQuery, shopSearchHref, type SearchReply, type Suggestion } from "@/lib/productSearch";

export type SearchStatus = "idle" | "loading" | "done" | "error";

const TYPING_PAUSE_MS = 200;

const Price = ({ item }: { item: Suggestion }) =>
  item.compareAtLabel ? (
    <span data-price className="flex flex-wrap items-baseline gap-x-2 text-sm">
      <span className="sr-only">{`Was ${item.compareAtLabel}. Now ${item.priceLabel}`}</span>
      <s aria-hidden="true" className="text-gray-500">{item.compareAtLabel}</s>
      <span aria-hidden="true" className="font-semibold text-brand-navy">{item.priceLabel}</span>
    </span>
  ) : (
    <span data-price className="block text-sm font-semibold text-brand-navy">{item.priceLabel}</span>
  );

// The whole page as it looks for one state of the search. The container below owns the typing, the waiting and the keyboard.
export const SearchOverlayView = ({
  query,
  status,
  items,
  hasMore,
  onQuery,
  onSubmit,
  onClose,
  onNavigate,
  panelRef,
  inputRef,
  onKeyDown,
}: {
  query: string;
  status: SearchStatus;
  items: Suggestion[];
  hasMore: boolean;
  onQuery: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  onNavigate: () => void;
  panelRef?: React.Ref<HTMLDivElement>;
  inputRef?: React.Ref<HTMLInputElement>;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}) => {
  const q = cleanQuery(query);
  const found = items.length;
  const message =
    status === "error"
      ? "We could not search right now."
      : !canSearch(q)
        ? "Type at least two letters to search the shop."
        : status === "loading" && found === 0
          ? "Searching…"
          : status === "done" && found === 0
            ? `No watches match “${q}”.`
            : "";

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Search the shop"
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[100] flex flex-col bg-[var(--page)] pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
    >
      <div className="border-b border-gray-200 px-4 md:px-8">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2 py-3">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="flex min-h-11 flex-1 items-center gap-3 rounded-lg bg-gray-100 px-4"
          >
            <button type="submit" aria-label="Search" className="-ml-3 inline-flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center">
              <Image src="/search.png" alt="" width={16} height={16} className="dark:invert" />
            </button>
            <input
              ref={inputRef}
              type="search"
              name="name"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search watches"
              aria-label="Search watches"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="search"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none"
            />
          </form>
          <button
            type="button"
            aria-label="Close search"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
            <span>Close</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-8">
        <div className="mx-auto w-full max-w-3xl py-4">
          <div aria-live="polite" className={message ? "py-2 text-gray-600" : "sr-only"}>
            {message || (found > 0 ? `${found} ${found === 1 ? "watch" : "watches"} found` : "")}
          </div>

          {found > 0 && (
            <ul className={`mt-1 ${status === "loading" ? "opacity-60" : ""}`}>
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={"/" + item.slug}
                    onClick={onNavigate}
                    className="flex min-h-16 items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-100 focus-visible:bg-gray-100 focus-visible:outline-none"
                  >
                    <span className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                      <Image src={item.imageUrl || "/product.png"} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block font-medium leading-snug">{item.name}</span>
                      <Price item={item} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {found > 0 && (
            <Link
              href={shopSearchHref(q)}
              onClick={onNavigate}
              className="mt-3 flex min-h-11 items-center justify-center rounded-lg bg-brand-navy px-4 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-gold hover:text-brand-navy"
            >
              {`See all results for “${q}”`}
            </Link>
          )}

          {(status === "error" || (status === "done" && found === 0 && canSearch(q))) && (
            <Link href="/shop" onClick={onNavigate} className="mt-2 inline-flex min-h-11 items-center font-semibold text-brand-navy underline underline-offset-4">
              Browse the whole shop
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled])';

// The search page: opened by the header's search box, it covers the page, searches the shop as the shopper types, and puts them back
// where they were when it closes.
const SearchOverlay = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  // Set when the search closes because the shopper is going to another page: focus then belongs at the top of that page.
  const skipRestore = useRef(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const show = () => {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
    };
    window.addEventListener(OPEN_SEARCH_EVENT, show);
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, show);
  }, []);

  // Another page is on its way, so the search page steps aside.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // While it is open the page behind does not scroll, the field has the keyboard, and closing gives focus back to where it was.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    input.current?.focus();
    input.current?.select();
    return () => {
      html.style.overflow = before;
      if (!skipRestore.current) opener.current?.focus();
      skipRestore.current = false;
    };
  }, [open]);

  // Ask the shop a moment after typing stops, and forget an answer that a newer word has made out of date.
  useEffect(() => {
    if (!open) return;
    const q = cleanQuery(query);
    if (!canSearch(q)) {
      setStatus("idle");
      setItems([]);
      setHasMore(false);
      return;
    }
    setStatus("loading");
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`search ${res.status}`);
        const reply: SearchReply = await res.json();
        setItems(reply.items);
        setHasMore(reply.hasMore);
        setStatus("done");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setItems([]);
        setHasMore(false);
        setStatus("error");
      }
    }, TYPING_PAUSE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    const nodes = Array.from(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (nodes.length === 0) return;
    const at = nodes.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Tab") {
      // Keep the keyboard on the search page: the page behind it is not reachable while it is open.
      const next = e.shiftKey ? (at <= 0 ? nodes.length - 1 : at - 1) : at === nodes.length - 1 ? 0 : at + 1;
      e.preventDefault();
      nodes[next].focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      // Arrow keys walk the results from the field and back.
      const results = nodes.filter((n) => n.closest("ul"));
      if (results.length === 0) return;
      const current = results.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      if (e.key === "ArrowDown") (current === -1 ? results[0] : results[Math.min(current + 1, results.length - 1)]).focus();
      else if (current <= 0) input.current?.focus();
      else results[current - 1].focus();
    }
  };

  if (!open) return null;

  return (
    <SearchOverlayView
      query={query}
      status={status}
      items={items}
      hasMore={hasMore}
      onQuery={setQuery}
      onSubmit={() => {
        const q = cleanQuery(query);
        if (!q) return;
        skipRestore.current = true;
        close();
        router.push(shopSearchHref(q));
      }}
      onClose={close}
      onNavigate={() => {
        skipRestore.current = true;
        close();
      }}
      panelRef={panel}
      inputRef={input}
      onKeyDown={onKeyDown}
    />
  );
};

export default SearchOverlay;
