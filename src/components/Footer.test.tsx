import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// A plain function, not a mock: the mock library flags a rejected promise it records as unhandled.
const store = vi.hoisted(() => ({ down: false, items: [] as unknown[] }));
vi.mock("@/lib/wixClientServer", () => ({
  wixClientServer: async () => ({
    collections: {
      queryCollections: () => ({
        find: async () => {
          if (store.down) throw new Error("down");
          return { items: store.items };
        },
      }),
    },
  }),
}));

import Footer from "@/components/Footer";

const items = [
  { _id: "all", name: "All Products", slug: "all-products" },
  { _id: "l", name: "Ladies Watches", slug: "ladies-watches" },
  { _id: "g", name: "Gent's Watches", slug: "gents-watches" },
  { _id: "n", name: "Naviforce", slug: "naviforce-watches-kenya" },
  { _id: "e", name: "Editor's Picks", slug: "editors-picks" },
  { _id: "c", name: "Customizable Gifts", slug: "customizable-gifts" },
  { _id: "x1", name: "Extra One", slug: "extra-one" },
  { _id: "x2", name: "Extra Two", slug: "extra-two" },
];

const render = async () => renderToStaticMarkup(await Footer());
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

beforeEach(() => {
  store.down = false;
  store.items = items;
});

describe("Footer", () => {
  it("is laid out as a grid, four columns on a computer and two on a phone", async () => {
    const html = await render();
    expect(html).toContain("grid-cols-2");
    expect(html).toContain("md:grid-cols-4");
  });

  it("has a column each for the brand, the shop, the pages and the shop's details", async () => {
    const t = text(await render());
    for (const heading of ["Shop", "Explore", "Visit us"]) expect(t).toContain(heading);
    expect(t).toContain("Watch Fusion Kenya");
  });

  it("lists the real categories as links, starting with the whole shop, and no more than six", async () => {
    const html = await render();
    const shopColumn = html.split(">Shop<")[1]?.split("</nav>")[0] ?? "";
    expect(shopColumn).toContain('href="/shop"');
    for (const slug of ["ladies-watches", "gents-watches", "naviforce-watches-kenya", "editors-picks", "customizable-gifts"]) {
      expect(shopColumn).toContain(`href="/shop?cat=${slug}"`);
    }
    expect(shopColumn).not.toContain("all-products");
    expect(shopColumn).not.toContain("extra-two");
    expect((shopColumn.match(/href="\/shop\?cat=/g) ?? []).length).toBeLessThanOrEqual(6);
  });

  it("still shows the whole-shop link when the categories cannot be loaded", async () => {
    store.down = true;
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const html = await render();
    logged.mockRestore();
    expect(html).toContain('href="/shop"');
    expect(html).not.toContain("cat=");
  });

  it("links only pages that exist: no Terms or Privacy until those pages are written", async () => {
    const t = text(await render());
    expect(t).not.toMatch(/Terms of Service|Privacy Policy|Couple Sets/);
    const html = await render();
    expect(html).not.toContain('href="#"');
    for (const path of ["/", "/shop", "/deals", "/contact"]) expect(html).toContain(`href="${path}"`);
  });

  it("shows the shop's real address, hours, phone and email", async () => {
    const html = await render();
    const t = text(html);
    expect(t).toContain("Stanbank House");
    expect(t).toContain("Moi Avenue");
    expect(t).toMatch(/Mon to Fri 8:30am to 7pm/);
    expect(html).toContain('href="tel:+254796044969"');
    expect(html).toContain('href="mailto:watchfusionkenya@gmail.com"');
    expect(html).toContain('href="https://wa.me/254796044969"');
  });

  it("links Instagram and TikTok with names a screen reader can say, in tap targets of at least 44 px", async () => {
    const html = await render();
    for (const name of ["Instagram", "TikTok"]) {
      const tag = html.match(new RegExp(`<a [^>]*aria-label="${name}"[^>]*>`))?.[0] ?? "";
      expect(tag).toContain('target="_blank"');
      expect(tag).toContain('rel="noopener noreferrer"');
      expect(tag).toMatch(/\bw-11\b/);
      expect(tag).toMatch(/\bh-11\b/);
    }
  });

  it("carries the copyright line without a year that could go stale on a page built months ago", async () => {
    const html = await render();
    expect(html).toContain("© Watch Fusion Kenya");
    expect(html).not.toMatch(/© \d{4}/);
  });

  it("keeps its text left aligned, with section titles that are headings for screen readers", async () => {
    const html = await render();
    expect(html).not.toContain("items-center md:items-start");
    expect((html.match(/<h2/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it("is the page's footer landmark", async () => {
    expect(await render()).toMatch(/^<footer/);
  });
});
