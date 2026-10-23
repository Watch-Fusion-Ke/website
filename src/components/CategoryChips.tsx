"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { categoryHref } from "@/lib/categoryPages";

export type Chip = { name: string; slug: string };

const chip = (active: boolean) =>
  `flex-shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors ${
    active ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-700 hover:bg-brand-gold hover:text-brand-navy"
  }`;

// The category pills of the shop. They stay in place while the shopper switches category, with the current one marked,
// and on a phone the strip slides so the current pill is in view.
const CategoryChips = ({ chips, activeSlug }: { chips: Chip[]; activeSlug: string | null }) => {
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    const strip = nav.current;
    const current = strip?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!strip || !current) return;
    // Only the strip itself moves, never the page behind it.
    const target = current.offsetLeft - (strip.clientWidth - current.offsetWidth) / 2;
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    strip.scrollTo({ left: Math.max(0, target), behavior: calm ? "auto" : "smooth" });
  }, [activeSlug]);

  return (
    <nav
      ref={nav}
      aria-label="Categories"
      className="relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide md:mx-0 md:flex-wrap md:px-0"
    >
      <Link href="/shop" aria-current={activeSlug === "" ? "page" : undefined} className={chip(activeSlug === "")}>
        All products
      </Link>
      {chips.map((c) => (
        <Link
          key={c.slug}
          href={categoryHref(c.slug)}
          aria-current={activeSlug === c.slug ? "page" : undefined}
          className={chip(activeSlug === c.slug)}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
};

export default CategoryChips;
