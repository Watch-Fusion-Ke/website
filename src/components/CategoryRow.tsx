"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import ChristmasCategoryLink from "@/components/ChristmasCategoryLink";
import { clampLeft, closed, hoverIn, hoverOut, press, type MenuState, type SiteMenu } from "@/lib/siteMenu";

// On a phone each entry is a pill in a strip that slides sideways; from a tablet up they are plain words with a gold underline on hover.
// The pill background is the theme's surface colour, set only below the tablet width: a plain bg-white class would be turned into a
// grey box behind each word by the dark theme's own bg-white rule, which beats the tablet override.
const entry =
  "inline-flex min-h-11 flex-shrink-0 items-center whitespace-nowrap rounded-full border border-gray-200 px-2.5 text-xs font-semibold text-gray-700 transition-colors duration-200 hover:border-black hover:bg-black hover:text-white max-md:bg-[var(--surface)] " +
  "md:min-h-0 md:rounded-none md:border-0 md:px-0 md:py-1.5 md:text-xl md:leading-[25.5px] md:text-gray-800 md:underline-offset-4 md:decoration-2 md:decoration-brand-gold md:hover:bg-transparent md:hover:text-gray-800 md:hover:underline";
const seasonalEntry =
  "inline-flex min-h-11 flex-shrink-0 items-center whitespace-nowrap rounded-full bg-brand-gold px-2.5 text-xs font-semibold text-brand-navy transition-colors duration-200 hover:brightness-95 md:min-h-0 md:px-4 md:py-2 md:text-base";
// The floating box under a menu button: light and flat, a thin border and a small shadow, in the page's own colour. The outer box has a
// little transparent room at the top so the pointer can cross from the button to the links without the menu closing. These classes are
// only on the outer box while it is open: a closed box carries no display class, because a display class would override the hidden
// attribute and show the links before anyone asked for them.
const panelOuter = "absolute top-full z-30 w-52 pt-1 md:left-[var(--menu-left)] max-md:left-[var(--menu-left)]";
const panelInner = "menu-in rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm dark:shadow-black/40";
const panelLink =
  "block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-brand-gold/15 focus-visible:bg-brand-gold/15";
// Hover opens a menu at once; leaving closes it after a short grace, so a slight slip off the edge does not make it flicker.
const LEAVE_GRACE_MS = 120;
const PANEL_WIDTH = 208;

// The store's All Products page is the whole shop, which is the plain shop address.
const shopHref = (slug: string) => (slug === "all-products" ? "/shop" : `/shop?cat=${slug}`);

const Chevron = ({ open }: { open: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`ml-1.5 inline-block transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// The categories above the banner: the main ones as links, the rest gathered into a few menus that open as a floating dropdown
// under their button: hovering a button opens it, a click pins it open until the next click elsewhere. The links of a closed menu stay
// in the page, hidden, so they can still be found and followed.
const CategoryRow = ({ menu }: { menu: SiteMenu }) => {
  const [state, setState] = useState<MenuState>(closed);
  const open = state.open;
  const [left, setLeft] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const lastButton = useRef<HTMLElement | null>(null);
  const byKeyboard = useRef(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  const place = (button: HTMLElement) => {
    const nav = root.current;
    if (nav) setLeft(clampLeft(button.getBoundingClientRect().left - nav.getBoundingClientRect().left, PANEL_WIDTH, nav.getBoundingClientRect().width));
  };
  const cancelLeave = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = null;
  };
  // Only a mouse or a pen hovers; a finger just taps.
  const hovering = (e: React.PointerEvent) => e.pointerType === "mouse" || e.pointerType === "pen";

  useEffect(() => cancelLeave, []);

  // A menu opened from the keyboard puts the keyboard on its first link, so Tab does not have to cross the rest of the row first.
  useEffect(() => {
    if (open === null || !byKeyboard.current) return;
    byKeyboard.current = false;
    root.current?.querySelector<HTMLElement>(`[data-menu="${CSS.escape(open)}"] a`)?.focus();
  }, [open]);

  useEffect(() => {
    if (open === null) return;
    // Escape gives the keyboard back to the button that opened the menu, so focus is not left on a link that has just disappeared.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setState(closed);
      lastButton.current?.focus();
    };
    // The box was placed under its button, so a window that changes width would leave it misplaced. A phone's address bar sliding in and
    // out changes only the height, which must not close a menu someone is reading.
    let width = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      setState(closed);
    };
    const onPress = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setState(closed);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPress);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPress);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  if (menu.row.length === 0) return null;
  const groups = menu.row.flatMap((e) => (e.kind === "menu" ? [e.group] : []));

  return (
    <div ref={root} className="py-3 md:py-8">
      <nav
        aria-label="Shop by category"
        className="relative"
        style={{ "--menu-left": `${left}px` } as React.CSSProperties}
        onPointerEnter={(e) => hovering(e) && cancelLeave()}
        onPointerLeave={(e) => {
          if (!hovering(e)) return;
          cancelLeave();
          leaveTimer.current = setTimeout(() => setState((s) => hoverOut(s)), LEAVE_GRACE_MS);
        }}
      >
        <div className="relative">
        <div className="flex gap-1.5 overflow-x-auto px-4 pr-8 scrollbar-hide md:items-center md:justify-center md:gap-12 md:pr-4 lg:gap-16">
          {menu.row.map((e) => {
            if (e.kind === "link") {
              const c = e.category;
              if (c.slug === "christmas-gift-packages") {
                return <ChristmasCategoryLink key={c.slug} name={c.name} href={shopHref(c.slug)} />;
              }
              return (
                <Link key={c.slug} href={shopHref(c.slug)} className={e.seasonal ? seasonalEntry : entry}>
                  {c.name}
                </Link>
              );
            }
            const g = e.group;
            const i = groups.indexOf(g);
            return (
              <button
                key={g.label}
                type="button"
                aria-expanded={open === g.label}
                aria-controls={`${id}-${i}`}
                onPointerEnter={(ev) => {
                  if (!hovering(ev)) return;
                  cancelLeave();
                  byKeyboard.current = false;
                  place(ev.currentTarget);
                  setState((s) => hoverIn(s, g.label));
                }}
                onClick={(ev) => {
                  byKeyboard.current = ev.detail === 0;
                  lastButton.current = ev.currentTarget;
                  place(ev.currentTarget);
                  setState((s) => press(s, g.label));
                }}
                className={entry}
              >
                {g.label}
                <Chevron open={open === g.label} />
              </button>
            );
          })}
        </div>
        {/* Right-edge fade + chevron: hints that the strip scrolls on a phone */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-8 items-center justify-end bg-gradient-to-l from-white via-white/80 to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a]/80 md:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-gray-400">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
        </div>
        {groups.map((g, i) => (
          <div key={g.label} id={`${id}-${i}`} data-menu={g.label} hidden={open !== g.label} className={open === g.label ? panelOuter : undefined}>
            <div className={panelInner}>
              <ul aria-label={g.label}>
                {g.items.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/shop?cat=${c.slug}`} className={panelLink} onClick={() => setState(closed)}>
                      {c.name}
                    </Link>
                    {c.children && c.children.length > 0 && (
                      <ul aria-label={c.name}>
                        {c.children.map((child) => (
                          <li key={child.slug}>
                            <Link href={`/shop?cat=${child.slug}`} className={`${panelLink} pl-6`} onClick={() => setState(closed)}>
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default CategoryRow;
