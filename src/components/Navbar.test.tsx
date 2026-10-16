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

  it("shows a cart link in the header", () => {
    expect(phoneHeader()).toContain('href="/cart"');
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
});
