import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {} }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/hooks/useWixClient", () => ({
  useWixClient: () => ({
    auth: { loggedIn: () => false },
    collections: { queryCollections: () => ({ find: async () => ({ items: [] }) }) },
  }),
}));

import Navbar from "@/components/Navbar";

const phoneHeader = () => {
  const html = renderToStaticMarkup(<Navbar />);
  const start = html.indexOf('data-testid="phone-header"');
  const end = html.indexOf('data-testid="desktop-header"');
  return html.slice(start, end);
};

describe("Navbar on a phone", () => {
  it("puts the menu button on the left, before the logo", () => {
    const html = phoneHeader();
    const menu = html.indexOf('aria-label="Open menu"');
    const logo = html.indexOf('alt="Watch Fusion Kenya"');
    expect(menu).toBeGreaterThan(-1);
    expect(logo).toBeGreaterThan(menu);
  });

  it("centres the logo between the menu button and the cart", () => {
    const html = phoneHeader();
    const grid = html.indexOf("grid-cols-[1fr_auto_1fr]");
    const menu = html.indexOf('aria-label="Open menu"');
    const logo = html.indexOf('alt="Watch Fusion Kenya"');
    const cart = html.indexOf('aria-label="Cart"');
    expect(grid).toBeGreaterThan(-1);
    expect(menu).toBeGreaterThan(grid);
    expect(logo).toBeGreaterThan(menu);
    expect(cart).toBeGreaterThan(logo);
  });

  it("keeps the logo small so the header looks calm", () => {
    const logoTag = phoneHeader().match(/<img[^>]*alt="Watch Fusion Kenya"[^>]*>/)?.[0] ?? "";
    const classes = (logoTag.match(/class="([^"]*)"/)?.[1] ?? "").split(" ");
    expect(classes).toContain("h-6");
    expect(classes.filter((c) => /^h-/.test(c))).toEqual(["h-6"]);
  });

  it("gives the logo link a tap area at least 44 px tall", () => {
    const link = phoneHeader().match(/<a[^>]*href="\/"[^>]*>(?=<span[^>]*><img[^>]*alt="Watch Fusion Kenya")/)?.[0] ?? "";
    expect(link).not.toBe("");
    expect(link.match(/class="([^"]*)"/)?.[1].split(" ")).toContain("h-11");
  });

  it("shows the header's own cart link, not only the one inside the menu", () => {
    expect(phoneHeader()).toContain('aria-label="Cart"');
  });

  it("shows a search field under the logo row", () => {
    const html = phoneHeader();
    expect(html.indexOf('name="name"')).toBeGreaterThan(html.indexOf('alt="Watch Fusion Kenya"'));
  });

  it("slides the menu in from the left and casts no shadow while it is closed", () => {
    const html = phoneHeader();
    expect(html).toContain("-translate-x-full");
    expect(html).toContain("left-0");
    expect(html).not.toContain("right-0");
    expect(html).not.toContain("shadow-2xl");
  });

  it("hides the closed menu from keyboards and screen readers instead of leaving its links reachable", () => {
    const html = phoneHeader();
    expect(html).toContain("invisible");
    expect(html).toContain('role="dialog"');
    expect(html).not.toContain('aria-hidden="false"');
  });
});
