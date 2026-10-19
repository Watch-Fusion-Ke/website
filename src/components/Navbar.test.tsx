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

  it("shows the logo without its small slogan, cropped from the picture so the name can be bigger", () => {
    const html = phoneHeader();
    const wrapper = html.match(/<span class="([^"]*)"[^>]*><img[^>]*alt="Watch Fusion Kenya"/)?.[1].split(" ") ?? [];
    expect(wrapper).toContain("h-7");
    expect(wrapper).toContain("overflow-hidden");
    expect(wrapper.some((c) => c.startsWith("aspect-["))).toBe(true);
    const img = html.match(/<img[^>]*alt="Watch Fusion Kenya"[^>]*>/)?.[0] ?? "";
    expect(img).toContain("object-cover");
    expect(img).toMatch(/object-\[50%_44%\]/);
  });

  it("gives the logo link a tap area at least 44 px tall", () => {
    const link = phoneHeader().match(/<a[^>]*href="\/"[^>]*>(?=<span[^>]*><span[^>]*><img[^>]*alt="Watch Fusion Kenya")/)?.[0] ?? "";
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

  it("keeps the menu drawer's content clear of the notch when the phone is turned sideways", () => {
    const drawer = phoneHeader().match(/role="dialog"[^>]*class="([^"]*)"/)?.[1].split(" ") ?? [];
    expect(drawer).toContain("pl-[env(safe-area-inset-left)]");
  });

  it("puts a visible dark mode switch in the phone header, next to the cart", () => {
    const html = phoneHeader();
    const toggle = html.lastIndexOf('aria-label="Dark mode"');
    expect(toggle).toBeGreaterThan(html.indexOf('alt="Watch Fusion Kenya"'));
    expect(toggle).toBeLessThan(html.indexOf('aria-label="Cart"'));
  });

  it("puts the same switch, with its written label, in the menu panel", () => {
    expect(phoneHeader()).toMatch(/role="dialog"[\s\S]*Dark mode[\s\S]*Light mode/);
  });

  it("puts the switch in the computer header too", () => {
    const html = renderToStaticMarkup(<Navbar />);
    const desktop = html.slice(html.indexOf('data-testid="desktop-header"'));
    expect(desktop).toContain('aria-label="Dark mode"');
  });

  it("turns the black cart and search icons light in the dark theme, so they can be seen", () => {
    const icons = phoneHeader().match(/<img[^>]*dark:invert[^>]*>/g) ?? [];
    expect(icons.length).toBeGreaterThanOrEqual(2);
  });

  it("does the same for the profile, bell, cart and search icons in the computer header", () => {
    const html = renderToStaticMarkup(<Navbar />);
    const desktop = html.slice(html.indexOf('data-testid="desktop-header"'));
    expect((desktop.match(/<img[^>]*dark:invert[^>]*>/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });

  it("gives the logo a soft gold glow in the dark theme, where it sits straight on the black page", () => {
    const phone = phoneHeader().match(/<img[^>]*alt="Watch Fusion Kenya"[^>]*>/)?.[0] ?? "";
    expect(phone).toMatch(/dark:drop-shadow-\[/);
    const html = renderToStaticMarkup(<Navbar />);
    const desktop = html.slice(html.indexOf('data-testid="desktop-header"')).match(/<img[^>]*alt="Watch Fusion Kenya"[^>]*>/)?.[0] ?? "";
    expect(desktop).toMatch(/dark:drop-shadow-\[/);
    expect(desktop).toContain("object-cover");
  });
});

describe("Navbar stays at the top while the page scrolls", () => {
  const html = renderToStaticMarkup(<Navbar />);
  const divs = html.match(/<div [^>]*class="[^"]*"[^>]*>/g) ?? [];
  const classes = (tag: string) => tag.match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
  const outer = classes(divs[0] ?? "");
  const panel = classes(divs[1] ?? "");

  it("sticks to the top of the screen on phones and large screens", () => {
    expect(outer).toContain("sticky");
    expect(outer).toContain("top-0");
  });

  it("sits above the page and the bottom dock, but under the menu drawer, the cart popup and the zoomed photo", () => {
    expect(outer).toContain("z-30");
  });

  it("keeps its place in the page when the search row folds, so the content below never jumps", () => {
    // the sticky frame keeps its full height; only the visible panel inside it grows and shrinks
    expect(outer.some((c) => c.startsWith("h-[var(--reserve"))).toBe(true);
    expect(outer).toContain("md:h-20");
    expect(outer).toContain("pointer-events-none");
    expect(panel).toContain("pointer-events-auto");
  });

  it("has a solid panel in the page colour in both themes, so nothing shows through it", () => {
    expect(panel).toContain("bg-[var(--page)]");
    expect(html).not.toMatch(/backdrop-blur/);
  });

  it("stays clear of a phone's status bar when the site is added to the home screen", () => {
    expect(panel.some((c) => c.includes("env(safe-area-inset-top)"))).toBe(true);
  });

  it("keeps the menu, logo, theme and cart row in view, and lets only the search row fold away", () => {
    const phone = phoneHeader();
    expect(phone).toContain("data-header-search");
    const rowAt = phone.indexOf("grid-cols-[1fr_auto_1fr]");
    const searchAt = phone.indexOf("data-header-search");
    expect(searchAt).toBeGreaterThan(rowAt);
    expect(phone.slice(rowAt, searchAt)).not.toContain("data-header-search");
  });

  it("folds the search row with a short slide, which is switched off for people who ask for less motion", () => {
    const search = html.match(/<div[^>]*data-header-search[^>]*>/)?.[0] ?? "";
    expect(search).toContain("transition-");
    expect(search).toContain("motion-reduce:transition-none");
    expect(search).toContain("grid-rows-[1fr]");
  });
});
