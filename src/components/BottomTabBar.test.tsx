import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({ pathname: "/", cat: null as string | null }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.cat ? { cat: nav.cat } : {}),
}));

import BottomTabBar, { TabBarView } from "@/components/BottomTabBar";
import WhatsAppButton, { WhatsAppButtonView } from "@/components/WhatsAppButton";

const render = () => renderToStaticMarkup(<BottomTabBar />);

beforeEach(() => {
  nav.pathname = "/";
  nav.cat = null;
});

describe("BottomTabBar", () => {
  it("shows the four tabs in order, as links", () => {
    const html = render();
    const order = ["Home", "Gents", "Ladies", "Cart"].map((l) => html.indexOf(`>${l}<`));
    expect(order.every((i) => i > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain('href="/list?cat=gents-watches"');
    expect(html).toContain('href="/list?cat=ladies-watches"');
    expect(html).toContain('href="/cart"');
  });

  it("keeps the first and last tab clear of the notch when the phone is turned sideways", () => {
    const html = render();
    expect(html).toContain("pl-[env(safe-area-inset-left)]");
    expect(html).toContain("pr-[env(safe-area-inset-right)]");
  });

  it("is only for phones, and is the page's main navigation landmark", () => {
    const html = render();
    expect(html).toContain("md:hidden");
    expect(html).toContain('<nav aria-label="Main"');
  });

  it("marks the current page for screen readers", () => {
    nav.pathname = "/list";
    nav.cat = "ladies-watches";
    const html = render();
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    const ladiesTag = html.match(/<a [^>]*href="\/list\?cat=ladies-watches"[^>]*>/)?.[0] ?? "";
    expect(ladiesTag).toContain('aria-current="page"');
  });

  it("marks nothing on a page that has no tab", () => {
    nav.pathname = "/contact";
    expect(render()).not.toContain("aria-current");
  });

  it("shows the number of items in the cart, and nothing when it is empty", () => {
    const empty = renderToStaticMarkup(<TabBarView pathname="/" cat={null} counter={0} />);
    expect(empty).not.toContain("data-cart-count");
    expect(empty).not.toContain('aria-label="Cart');
    const full = renderToStaticMarkup(<TabBarView pathname="/" cat={null} counter={3} />);
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

describe("BottomTabBar premium look", () => {
  const tabs = (path = "/", cat: string | null = null, counter = 0) =>
    renderToStaticMarkup(<TabBarView pathname={path} cat={cat} counter={counter} />);

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

  it("marks the current tab with a short gold bar on top, a soft gold halo behind its icon and brand colour text", () => {
    const html = tabs("/", null);
    const current = html.match(/<a [^>]*aria-current="page"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? "";
    const bar = current.match(/<span aria-hidden="true" class="([^"]*)"/)?.[1] ?? "";
    expect(bar).toContain("bg-brand-gold");
    expect(bar).toContain("h-0.5");
    expect(current).toMatch(/bg-brand-gold\/15/);
    expect(current).toMatch(/text-brand-navy/);
    const other = html.match(/<a [^>]*href="\/cart"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? "";
    expect(other).not.toMatch(/bg-brand-gold/);
  });

  it("is a clean plain bar: no blur, no shadow stack, a hairline on top", () => {
    const nav = tabs().match(/<nav [^>]*>/)?.[0] ?? "";
    expect(nav).toContain("border-t");
    expect(nav).not.toMatch(/backdrop-blur|shadow/);
  });

  it("keeps every tab at least 56 px tall and keeps the cart count readable", () => {
    expect(tabs()).toMatch(/min-h-14/);
    expect(tabs("/", null, 3)).toContain('data-cart-count="3"');
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
    expect(classes).toContain("bottom-[calc(5rem_+_env(safe-area-inset-bottom))]");
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
