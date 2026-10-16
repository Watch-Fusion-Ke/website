import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({ pathname: "/", cat: null as string | null }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.cat ? { cat: nav.cat } : {}),
}));

import BottomTabBar, { TabBarView } from "@/components/BottomTabBar";
import WhatsAppButton from "@/components/WhatsAppButton";

const render = () => renderToStaticMarkup(<BottomTabBar />);

beforeEach(() => {
  nav.pathname = "/";
  nav.cat = null;
});

describe("BottomTabBar", () => {
  it("shows the five tabs in order, as links", () => {
    const html = render();
    const order = ["Home", "Gents", "Ladies", "Cart", "Chat"].map((l) => html.indexOf(`>${l}<`));
    expect(order.every((i) => i > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain('href="/list?cat=gents-watches"');
    expect(html).toContain('href="/list?cat=ladies-watches"');
    expect(html).toContain('href="/cart"');
  });

  it("is only for phones, and is the page's main navigation landmark", () => {
    const html = render();
    expect(html).toContain("md:hidden");
    expect(html).toContain('<nav aria-label="Main"');
  });

  it("tells screen reader users that Chat opens WhatsApp in a new tab", () => {
    expect(render()).toContain('aria-label="Chat on WhatsApp (opens in a new tab)"');
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

  it("opens WhatsApp in a new tab without giving the new page access to this one", () => {
    const html = render();
    expect(html).toContain('href="https://wa.me/254796044969"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});

describe("WhatsAppButton", () => {
  it("is hidden on phones, where the Chat tab replaces it", () => {
    const html = renderToStaticMarkup(<WhatsAppButton />);
    expect(html).toContain("max-md:hidden");
    expect(html).toContain('href="https://wa.me/254796044969"');
  });
});
