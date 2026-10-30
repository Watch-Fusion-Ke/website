"use client";

import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import ChristmasCategoryLink from "@/components/ChristmasCategoryLink";
import { categoryHref } from "@/lib/categoryPages";
import { PHONE_FOCUS_SLUG, centreScrollLeft, clampLeft, closed, hoverIn, hoverOut, phoneOrder, press, scrollEdges, type MenuState, type SiteMenu } from "@/lib/siteMenu";

// Every entry is plain words, on a phone as on a computer, with a gold underline on hover or press. A drawn box round each word costs
// about 20 px of width for nothing: the 44 px tap area is invisible padding (min-h-11 and px-3), which is what lets the whole row stay
// narrow. On a phone the row slides sideways and snaps entry by entry; from a tablet up it is centred and does not slide.
// No entry has a background class: the dark theme turns a plain bg-white into a grey box behind each word.
const entry =
  // On a phone each entry's place comes from --phone-order (see phoneOrder), set on the entry itself; a computer ignores it.
  "inline-flex min-h-11 flex-shrink-0 items-center whitespace-nowrap px-3 text-[13px] font-semibold text-gray-700 underline-offset-[10px] decoration-2 decoration-brand-gold transition-colors duration-200 max-md:snap-center max-md:[order:var(--phone-order)] active:underline " +
  // Hover styles apply only to a pointer that really hovers, so a tap on a phone does not leave the last entry stuck underlined. The focus
  // ring is drawn inside the entry because the row clips anything outside its 44 px height.
  "[@media(hover:hover)]:hover:text-black [@media(hover:hover)]:hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-gold " +
  "md:min-h-0 md:px-0 md:py-1.5 md:text-lg lg:text-xl md:leading-[25.5px] md:text-gray-800 md:underline-offset-4 md:[@media(hover:hover)]:hover:text-gray-800";
// The one place a gold chip is kept: a seasonal page, so it stands out from the plain words.
const seasonalEntry =
  "inline-flex min-h-11 flex-shrink-0 items-center whitespace-nowrap rounded-full bg-brand-gold px-3 text-[13px] font-semibold text-brand-navy transition-colors duration-200 hover:brightness-95 max-md:snap-center max-md:[order:var(--phone-order)] md:min-h-0 md:px-4 md:py-2 md:text-base";
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
// The row has 16 px of padding and each entry 12 px of its own, all empty: scrolling past just that hides no word, so no fade is needed.
const EDGE_SLACK = 28;

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
  const strip = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });
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

  // The phone row opens centred on the marked entry (Christmas), as the computer's row is, with part of its neighbours showing on both
  // sides to say that it slides. It is done before the first paint, so there is no second jump, and again when the width changes (the
  // phone is turned). A row that fits, as on a computer, is left where it is.
  const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;
  useBeforePaint(() => {
    const row = strip.current;
    if (!row) return;
    const centre = () => {
      const focus = row.querySelector<HTMLElement>("[data-row-focus]");
      if (focus) row.scrollLeft = centreScrollLeft(focus.offsetLeft, focus.offsetWidth, row.clientWidth, row.scrollWidth);
      setEdges(scrollEdges(row.scrollLeft, row.clientWidth, row.scrollWidth, EDGE_SLACK));
    };
    centre();
    if (typeof ResizeObserver === "undefined") return;
    let width = row.clientWidth;
    const observer = new ResizeObserver(() => {
      if (row.clientWidth === width) return; // a height change, such as the phone's address bar, is not a turn
      width = row.clientWidth;
      centre();
    });
    observer.observe(row);
    return () => observer.disconnect();
  }, []);
  const onRowScroll = () => {
    const row = strip.current;
    if (!row) return;
    const next = scrollEdges(row.scrollLeft, row.clientWidth, row.scrollWidth, EDGE_SLACK);
    setEdges((prev) => (prev.atStart === next.atStart && prev.atEnd === next.atEnd ? prev : next));
    // An open menu was placed under its button, which has just moved: shut it rather than leave its box where the button was.
    setState((s) => (s.open === null ? s : closed));
  };
  // Keyboard focus on an entry that is partly under a fade brings the whole entry into view. A tap does not, only the keyboard.
  const onRowFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.matches?.(":focus-visible")) target.scrollIntoView?.({ inline: "center", block: "nearest" });
  };

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
  const phone = phoneOrder(menu.row);
  const orderStyle = (index: number) => ({ "--phone-order": phone[index] }) as React.CSSProperties;

  return (
    <div ref={root} className="py-1 md:py-8">
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
        <div ref={strip} onScroll={onRowScroll} onFocus={onRowFocus} className="relative flex scroll-px-4 overflow-x-auto px-4 scrollbar-hide max-md:snap-x max-md:snap-proximity md:items-center md:gap-6 md:[&>:first-child]:ml-auto md:[&>:last-child]:mr-auto lg:gap-8 xl:gap-16">
          {menu.row.map((e, index) => {
            if (e.kind === "link") {
              const c = e.category;
              if (c.slug === PHONE_FOCUS_SLUG) {
                return <ChristmasCategoryLink key={c.slug} name={c.name} href={categoryHref(c.slug)} style={orderStyle(index)} />;
              }
              return (
                <Link key={c.slug} href={categoryHref(c.slug)} style={orderStyle(index)} className={e.seasonal ? seasonalEntry : entry}>
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
                style={orderStyle(index)}
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
        {/* Fades the end of the phone row that has more beyond it, and only that end */}
        {!edges.atStart && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a]/80 lg:hidden" />
        )}
        {!edges.atEnd && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a]/80 lg:hidden" />
        )}
        </div>
        {groups.map((g, i) => (
          <div key={g.label} id={`${id}-${i}`} data-menu={g.label} hidden={open !== g.label} className={open === g.label ? panelOuter : undefined}>
            <div className={panelInner}>
              <ul aria-label={g.label}>
                {g.items.map((c) => (
                  <li key={c.slug}>
                    <Link href={categoryHref(c.slug)} className={panelLink} onClick={() => setState(closed)}>
                      {c.name}
                    </Link>
                    {c.children && c.children.length > 0 && (
                      <ul aria-label={c.name}>
                        {c.children.map((child) => (
                          <li key={child.slug}>
                            <Link href={categoryHref(child.slug)} className={`${panelLink} pl-6`} onClick={() => setState(closed)}>
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
