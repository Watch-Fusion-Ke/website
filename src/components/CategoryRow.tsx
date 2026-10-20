"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { nextOpen, type SiteMenu } from "@/lib/siteMenu";

// On a phone each entry is a pill in a strip that slides sideways; from a tablet up they are plain words with a gold underline on hover.
const entry =
  "flex-shrink-0 whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:border-black hover:bg-black hover:text-white " +
  "md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-0 md:text-xl md:leading-[25.5px] md:text-gray-800 md:underline-offset-4 md:decoration-2 md:decoration-brand-gold md:hover:bg-transparent md:hover:text-gray-800 md:hover:underline";
const seasonalEntry =
  "flex-shrink-0 whitespace-nowrap rounded-full bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-navy transition-colors duration-200 hover:brightness-95 md:text-base";
const subEntry =
  "whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:border-black hover:bg-black hover:text-white";

const Chevron = ({ open }: { open: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`ml-1.5 inline-block transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// The categories above the banner: the main ones as links, the rest gathered into a few menus that open a second row of links
// under the first. The links of a closed menu stay in the page, hidden, so they can still be found and followed.
const CategoryRow = ({ menu }: { menu: SiteMenu }) => {
  const [open, setOpen] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onPress = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPress);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPress);
    };
  }, [open]);

  if (menu.primary.length + menu.groups.length + menu.seasonal.length === 0) return null;

  return (
    <div ref={root} className="py-4 md:py-8">
      <nav aria-label="Shop by category" className="relative">
        <div className="flex gap-3 overflow-x-auto px-4 pr-10 scrollbar-hide md:items-center md:justify-center md:gap-12 md:pr-4 lg:gap-16">
          {menu.primary.map((c) => (
            <Link key={c.slug} href={`/shop?cat=${c.slug}`} className={entry}>
              {c.name}
            </Link>
          ))}
          {menu.groups.map((g, i) => (
            <button
              key={g.label}
              type="button"
              aria-expanded={open === g.label}
              aria-controls={`${id}-${i}`}
              onClick={() => setOpen((cur) => nextOpen(cur, g.label))}
              className={entry}
            >
              {g.label}
              <Chevron open={open === g.label} />
            </button>
          ))}
          {menu.seasonal.map((c) => (
            <Link key={c.slug} href={`/shop?cat=${c.slug}`} className={seasonalEntry}>
              {c.name}
            </Link>
          ))}
        </div>
        {/* Right-edge fade + chevron: hints that the strip scrolls on a phone */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-14 items-center justify-end bg-gradient-to-l from-white via-white/80 to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a]/80 md:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-gray-400">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </nav>
      {menu.groups.map((g, i) => (
        <div key={g.label} id={`${id}-${i}`} hidden={open !== g.label} className="mt-3 flex flex-wrap justify-center gap-2 px-4">
          {g.items.map((c) => (
            <Link key={c.slug} href={`/shop?cat=${c.slug}`} className={subEntry}>
              {c.name}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
};

export default CategoryRow;
