import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
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
    expect(wrapper).toContain("h-9");
    expect(wrapper).toContain("overflow-hidden");
    expect(wrapper).toContain("aspect-[2209/823]");
    const img = html.match(/<img[^>]*alt="Watch Fusion Kenya"[^>]*>/)?.[0] ?? "";
    expect(img).toContain("object-cover");
    expect(img).toContain("object-top");
  });

  it("starts the crop at the very top of the picture so the ring on the W is not cut off, and ends it above the slogan", () => {
    // the picture is 2209 x 937: the ring starts at row 0, the name ends at row 806, the slogan starts at row 840
    const html = renderToStaticMarkup(<Navbar />);
    const crops = html.match(/aspect-\[(\d+)\/(\d+)\]/g) ?? [];
    expect(crops.length).toBeGreaterThanOrEqual(2);
    for (const crop of crops) {
      const [, w, h] = crop.match(/\[(\d+)\/(\d+)\]/) ?? [];
      const rowsShown = (Number(h) / Number(w)) * 2209;
      expect(Number(w)).toBe(2209);
      expect(rowsShown).toBeGreaterThan(806);
      expect(rowsShown).toBeLessThan(840);
    }
    expect(html).not.toMatch(/object-\[50%_44%\]/);
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
    const dark = (markup: string) => markup.match(/<img[^>]*%2Flogo\.png[^>]*>/)?.[0] ?? "";
    expect(dark(phoneHeader())).toMatch(/dark:drop-shadow-\[/);
    const html = renderToStaticMarkup(<Navbar />);
    const desktop = dark(html.slice(html.indexOf('data-testid="desktop-header"')));
    expect(desktop).toMatch(/dark:drop-shadow-\[/);
    expect(desktop).toContain("object-cover");
  });

  it("shows the logo straight on the page, with no black box behind it, in both themes", () => {
    expect(renderToStaticMarkup(<Navbar />)).not.toContain("bg-brand-black");
  });

  it("has a version of the logo with black lettering for the light theme and the white-lettered one for the dark theme, on the phone and the computer", () => {
    const html = renderToStaticMarkup(<Navbar />);
    const desktopAt = html.indexOf('data-testid="desktop-header"');
    for (const part of [html.slice(0, desktopAt), html.slice(desktopAt)]) {
      const light = part.match(/<img[^>]*%2Flogo-on-light\.png[^>]*>/)?.[0] ?? "";
      const dark = part.match(/<img[^>]*%2Flogo\.png[^>]*>/)?.[0] ?? "";
      expect(light).toContain("dark:hidden");
      expect(light).toContain('alt="Watch Fusion Kenya"');
      expect(dark).toMatch(/\bhidden\b/);
      expect(dark).toContain("dark:block");
      expect(dark).toContain('alt=""');
    }
  });

  it("names the home link on the link itself, so screen readers hear it in the dark theme where the lettered image is hidden", () => {
    const html = renderToStaticMarkup(<Navbar />);
    const desktopAt = html.indexOf('data-testid="desktop-header"');
    for (const part of [html.slice(0, desktopAt), html.slice(desktopAt)]) {
      const link = part.match(/<a [^>]*href="\/"[^>]*>(?=<span[^>]*><img)/)?.[0] ?? "";
      expect(link).toContain('aria-label="Watch Fusion Kenya, home"');
    }
  });

  it("loads whichever logo is shown straight away, without preloading the hidden one", () => {
    const html = renderToStaticMarkup(<Navbar />);
    const logos = html.match(/<img[^>]*%2Flogo(?:-on-light)?\.png[^>]*>/g) ?? [];
    expect(logos).toHaveLength(4);
    for (const logo of logos) expect(logo).toContain('loading="eager"');
    expect(html).not.toMatch(/<link[^>]*rel="preload"[^>]*logo/);
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

  it("makes room for itself when a keyboard user tabs to a link or box near the top of the screen", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toMatch(/html\s*\{[^}]*scroll-padding-top:\s*[\d.]+rem/);
  });

  it("sits above the bottom tab bar and the chat icon, so the open menu covers them, and under the zoomed photo", () => {
    // The header makes its own layer, so the menu drawer inside it counts at the header's level, not its own.
    const z = (file: string, pattern: RegExp) => Number(readFileSync(file, "utf8").match(pattern)?.[1]);
    const dock = z("src/components/BottomTabBar.tsx", /\bz-(\d+)\b/);
    const chat = z("src/components/WhatsAppButton.tsx", /z-\[(\d+)\]/);
    const zoom = z("src/components/ProductImages.tsx", /z-\[(\d+)\]/);
    const header = Number(outer.find((c) => /^z-\[\d+\]$/.test(c))?.match(/\d+/)?.[0]);
    expect(header).toBeGreaterThan(dock);
    expect(header).toBeGreaterThan(chat);
    expect(header).toBeLessThan(zoom);
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
