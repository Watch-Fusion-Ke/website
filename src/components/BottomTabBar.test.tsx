import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({ pathname: "/", name: null as string | null }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.name ? { name: nav.name } : {}),
  useRouter: () => ({ push: () => {} }),
}));

import BottomTabBar, { TabBarView } from "@/components/BottomTabBar";
import WhatsAppButton, { WhatsAppButtonView } from "@/components/WhatsAppButton";

const render = () => renderToStaticMarkup(<BottomTabBar />);

beforeEach(() => {
  nav.pathname = "/";
  nav.name = null;
});

describe("BottomTabBar", () => {
  it("shows Home, Shop, Search and Cart in order", () => {
    const html = render();
    const order = ["Home", "Shop", "Search", "Cart"].map((l) => html.indexOf(`>${l}<`));
    expect(order.every((i) => i > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain('href="/shop"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('href="/cart"');
  });

  it("keeps the first and last tab clear of the notch when the phone is turned sideways", () => {
    const html = render();
    expect(html).toContain("env(safe-area-inset-left)");
    expect(html).toContain("env(safe-area-inset-right)");
  });

  it("is only for phones, and is the page's main navigation landmark", () => {
    const html = render();
    expect(html).toContain("md:hidden");
    expect(html).toContain('<nav aria-label="Main"');
  });

  it("marks the current page for screen readers", () => {
    nav.pathname = "/shop";
    const html = render();
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    const shopTag = html.match(/<a [^>]*href="\/shop"[^>]*>/)?.[0] ?? "";
    expect(shopTag).toContain('aria-current="page"');
  });

  it("marks Search on search results and shows its field above the dock when opened", () => {
    const results = renderToStaticMarkup(<TabBarView pathname="/shop" name="NAVIFORCE" counter={0} />);
    expect(results.match(/aria-current="page"/g)).toHaveLength(1);
    expect(results).not.toContain('role="search"');
    const open = renderToStaticMarkup(<TabBarView pathname="/shop" name={null} counter={0} searchOpen />);
    expect(open).toContain('role="search"');
    expect(open).toContain('name="name"');
    expect(open).toContain('aria-expanded="true"');
    expect(open).toContain('placeholder="e.g. MEGIR or NAVIFORCE"');
    expect(open.indexOf('role="search"')).toBeLessThan(open.indexOf('<nav aria-label="Main"'));
    expect(open.match(/^<div class="([^"]*)"/)?.[1]).toContain("z-40");
  });

  it("marks nothing on a page that has no tab", () => {
    nav.pathname = "/contact";
    expect(render()).not.toContain("aria-current");
  });

  it("shows the number of items in the cart, and nothing when it is empty", () => {
    const empty = renderToStaticMarkup(<TabBarView pathname="/" name={null} counter={0} />);
    expect(empty).not.toContain("data-cart-count");
    expect(empty).not.toContain('aria-label="Cart');
    const full = renderToStaticMarkup(<TabBarView pathname="/" name={null} counter={3} />);
    expect(full).toContain('data-cart-count="3"');
    expect(full).toContain('aria-label="Cart, 3 items"');
  });

  it("has no WhatsApp link and splits the bar into four equal columns", () => {
    const html = render();
    expect(html).not.toContain("wa.me");
    expect(html).not.toContain("WhatsApp");
    expect(html).toContain("grid-cols-4");
  });
});

describe("BottomTabBar look", () => {
  const tabs = (path = "/", name: string | null = null, counter = 0) =>
    renderToStaticMarkup(<TabBarView pathname={path} name={name} counter={counter} />);

  it("draws finer icons, thinner than the rest of the site, one of its own for each tab", () => {
    const html = tabs();
    const svgs = html.match(/<svg[^>]*>[\s\S]*?<\/svg>/g) ?? [];
    expect(svgs).toHaveLength(4);
    for (const svg of svgs) expect(svg).toContain('stroke-width="1.5"');
    expect(new Set(svgs).size).toBe(4);
  });

  it("shows the labels in small spaced capitals", () => {
    const label = tabs().match(/<span class="([^"]*)">Home<\/span>/)?.[1].split(" ") ?? [];
    expect(label).toContain("uppercase");
    expect(label.some((c) => c.startsWith("tracking-"))).toBe(true);
    expect(label).toContain("text-[10px]");
  });

  it("floats as a rounded dock lifted off the edges of the screen, not as a bar across the bottom", () => {
    const html = tabs();
    const wrapper = html.match(/^<div [^>]*>/)?.[0] ?? "";
    expect(wrapper).toContain("fixed");
    expect(wrapper).toContain("bottom-0");
    expect(wrapper).toContain("pointer-events-none");
    expect(wrapper).toContain("env(safe-area-inset-bottom)");
    const nav = html.match(/<nav [^>]*>/)?.[0] ?? "";
    expect(nav).toContain("rounded-[1.75rem]");
    expect(nav).toContain("pointer-events-auto");
    expect(nav).toMatch(/shadow-/);
    expect(nav).toMatch(/ring-1/);
    expect(nav).not.toContain("border-t");
  });

  it("is a warm white dock in the light theme and a lifted navy dock with a gold edge in the dark theme", () => {
    const nav = tabs().match(/<nav [^>]*>/)?.[0] ?? "";
    expect(nav).toContain("bg-[#FFFDF8]");
    expect(nav).toContain("dark:bg-[#1B1F33]");
    expect(nav).toContain("dark:ring-brand-gold/40");
  });

  it("is never the brand navy of the Add to cart buttons, so the two do not compete", () => {
    const nav = tabs().match(/<nav [^>]*>/)?.[0] ?? "";
    expect(nav).not.toMatch(/bg-\[#1E2235\]/i);
    expect(nav).not.toContain("bg-brand-navy");
  });

  it("has no blur, which would slow older phones", () => {
    expect(tabs()).not.toMatch(/backdrop-blur/);
  });

  it("marks the current tab in navy (gold in the dark theme) with a soft gold pill behind the icon", () => {
    const current = tabs("/", null).match(/<a [^>]*aria-current="page"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? "";
    expect(current).toContain("text-[#1E2235]");
    expect(current).toContain("dark:text-brand-gold");
    expect(current).toContain("bg-brand-gold/25");
    expect(current).toContain("dark:bg-brand-gold/15");
    expect(current).not.toMatch(/text-gray-600/);
    const other = tabs("/", null).match(/<a [^>]*href="\/cart"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? "";
    expect(other).not.toMatch(/bg-brand-gold/);
    expect(other).toContain("text-gray-600");
  });

  it("keeps the other tabs readable on both docks, at a contrast of at least 4.5 to 1", () => {
    const channel = (v: number) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    const lum = ([r, g, b]: number[]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    const ratio = (a: number[], b: number[]) => {
      const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
      return (hi + 0.05) / (lo + 0.05);
    };
    // the grey the site calls gray-600, in each theme, on the dock behind it
    expect(ratio([75, 85, 99], [255, 253, 248])).toBeGreaterThanOrEqual(4.5);
    expect(ratio([188, 192, 208], [27, 31, 51])).toBeGreaterThanOrEqual(4.5);
    // the navy of the current tab on the warm white, and the gold of the dark theme on its dock
    expect(ratio([30, 34, 53], [255, 253, 248])).toBeGreaterThanOrEqual(4.5);
    expect(ratio([212, 174, 83], [27, 31, 51])).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps every tab at least 56 px tall and keeps the cart count readable against the dock", () => {
    expect(tabs()).toMatch(/min-h-14/);
    const full = tabs("/", null, 3);
    expect(full).toContain('data-cart-count="3"');
    const badge = full.match(/<span data-cart-count[^>]*>/)?.[0] ?? "";
    expect(badge).toContain("bg-brand-gold");
    expect(badge).toContain("ring-[#FFFDF8]");
    expect(badge).toContain("dark:ring-[#1B1F33]");
  });
});

describe("WhatsAppButton", () => {
  const html = () => renderToStaticMarkup(<WhatsAppButton />);

  it("opens the shop's WhatsApp chat in a new tab without giving the new page access to this one", () => {
    expect(html()).toContain('href="https://wa.me/254796044969"');
    expect(html()).toContain('target="_blank"');
    expect(html()).toContain('rel="noopener noreferrer"');
    expect(html()).toContain('aria-label="Chat on WhatsApp (opens in a new tab)"');
  });

  it("shows on phones as well as large screens", () => {
    expect(html()).not.toContain("max-md:hidden");
    expect(html()).not.toContain("hidden");
  });

  it("floats above the phone tab bar and the iPhone home strip, then drops to the corner on large screens", () => {
    const classes = html().match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
    expect(classes).toContain("fixed");
    expect(classes).toContain("bottom-[calc(6.5rem_+_env(safe-area-inset-bottom))]");
    expect(classes).toContain("md:bottom-6");
  });

  it("stays clear of the notch when the phone is turned sideways", () => {
    const classes = html().match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
    expect(classes).toContain("right-[max(1rem,env(safe-area-inset-right))]");
    expect(classes).toContain("md:right-[max(1.5rem,env(safe-area-inset-right))]");
    expect(classes).not.toContain("right-4");
    expect(classes).not.toContain("md:right-6");
  });

  it("starts visible, fades out of the way while the page scrolls, and cannot be tapped while hidden", () => {
    const classes = html().match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
    expect(classes).toContain("opacity-100");
    expect(classes).toContain("transition-[transform,opacity]");
    expect(classes).toContain("focus-visible:opacity-100");
    expect(classes).not.toContain("opacity-0");
    expect(classes).not.toContain("pointer-events-none");
  });

  it("fades out and cannot be tapped while hidden", () => {
    const classes = renderToStaticMarkup(<WhatsAppButtonView hidden />).match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
    expect(classes).toContain("opacity-0");
    expect(classes).toContain("pointer-events-none");
    expect(classes).not.toContain("opacity-100");
  });

  it("is a tap target of at least 44 px", () => {
    const classes = html().match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
    expect(classes).toContain("w-14");
    expect(classes).toContain("h-14");
    expect(classes).toContain("md:hover:scale-110");
  });
});
