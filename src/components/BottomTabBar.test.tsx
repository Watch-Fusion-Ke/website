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
