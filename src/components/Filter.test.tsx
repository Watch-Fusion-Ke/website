import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({ query: "" }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/shop",
  useSearchParams: () => new URLSearchParams(nav.query),
  useRouter: () => ({ replace: () => {} }),
}));

import Filter, { cleanPrice, nextUrl, orderedPrices } from "@/components/Filter";

const render = (query = "", bounds?: { min: number; max: number }) => {
  nav.query = query;
  return renderToStaticMarkup(<Filter bounds={bounds} />);
};

describe("Filter", () => {
  it("offers sorting and a price range, each with a visible label", () => {
    const html = render();
    expect(html).toMatch(/<label[^>]*>Sort by<\/label>/);
    expect(html).toMatch(/<label[^>]*>Min price<\/label>/);
    expect(html).toMatch(/<label[^>]*>Max price<\/label>/);
    expect(html).toContain('name="sort"');
    expect(html).toContain('name="min"');
    expect(html).toContain('name="max"');
  });

  it("lists the sort choices with the right direction", () => {
    const html = render();
    expect(html).toContain('value="asc price">Price: low to high');
    expect(html).toContain('value="desc price">Price: high to low');
    expect(html).toContain('value="desc created">Newest first');
    expect(html).not.toContain("Oldest");
  });

  it("drops the controls that did nothing", () => {
    const html = render();
    for (const gone of ["Physical", "Digital", "New Arrival", "Popular", "All Filters", 'name="type"', 'name="cat"']) {
      expect(html).not.toContain(gone);
    }
  });

  it("keeps what the shopper already chose", () => {
    const html = render("sort=asc+price&min=1000&max=5000");
    expect(html).toMatch(/<option value="asc price" selected/);
    expect(html).toContain('value="1000"');
    expect(html).toContain('value="5000"');
  });

  it("applies the price range with a button and can clear it", () => {
    const html = render("min=1000");
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>Apply<\/button>/);
    expect(html).toContain("Clear");
  });

  it("uses numeric keyboards for prices and no pink", () => {
    const html = render();
    expect(html).toContain('inputMode="numeric"');
    expect(html).not.toMatch(/pink|F35C7A|EBEDED/i);
  });
});

describe("nextUrl", () => {
  it("sets a choice and always goes back to the first page, so a filter cannot strand the shopper past the end", () => {
    expect(nextUrl("/shop", new URLSearchParams("cat=gents&page=2"), { sort: "asc price" })).toBe(
      "/shop?cat=gents&sort=asc+price"
    );
  });

  it("removes a choice that is emptied", () => {
    expect(nextUrl("/shop", new URLSearchParams("min=100&max=900"), { min: "", max: "900" })).toBe("/shop?max=900");
  });

  it("goes to the bare page when nothing is left", () => {
    expect(nextUrl("/list", new URLSearchParams("min=100"), { min: "" })).toBe("/list");
  });
});

describe("cleanPrice", () => {
  it("keeps whole numbers and strips commas, spaces and a currency mark", () => {
    expect(cleanPrice("3000")).toBe("3000");
    expect(cleanPrice(" 3,500 ")).toBe("3500");
    expect(cleanPrice("KES 1,200")).toBe("1200");
  });

  it("drops anything that is not a price", () => {
    for (const junk of ["abc", "", "-5", "0x10", "1.5.2", "  "]) expect(cleanPrice(junk)).toBe("");
  });
});

describe("orderedPrices", () => {
  it("swaps a minimum that is above the maximum", () => {
    expect(orderedPrices("5000", "1000")).toEqual({ min: "1000", max: "5000" });
    expect(orderedPrices("1000", "5000")).toEqual({ min: "1000", max: "5000" });
    expect(orderedPrices("", "5000")).toEqual({ min: "", max: "5000" });
  });
});

describe("Filter boxes", () => {
  it("are rebuilt when the address changes, so they never show a price the list is no longer filtered by", () => {
    const withPrice = render("min=3000");
    const without = render("");
    expect(withPrice).toContain('value="3000"');
    expect(without).not.toContain('value="3000"');
  });
});

describe("Filter price slider", () => {
  const bounds = { min: 0, max: 6500 };

  it("replaces the typed boxes with two handles on one bar, each named for screen readers", () => {
    const html = render("", bounds);
    expect(html.match(/<input[^>]*type="range"/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Minimum price"');
    expect(html).toContain('aria-label="Maximum price"');
    expect(html).not.toContain('name="min"');
    expect(html).not.toContain(">Apply<");
  });

  it("covers the whole price range of the shop in steps of 100", () => {
    const html = render("", bounds);
    for (const input of html.match(/<input[^>]*type="range"[^>]*>/g) ?? []) {
      expect(input).toContain('min="0"');
      expect(input).toContain('max="6500"');
      expect(input).toContain('step="100"');
    }
  });

  it("starts at the full range and shows the prices in words", () => {
    const t = render("", bounds).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    expect(t).toContain("KES 0");
    expect(t).toContain("KES 6,500");
  });

  it("starts at the shopper's chosen range", () => {
    const html = render("min=3000&max=4500", bounds);
    expect(html).toContain('value="3000"');
    expect(html).toContain('value="4500"');
    expect(html.replace(/<[^>]+>/g, " ")).toContain("KES 3,000");
    expect(html).toContain("Clear");
  });

  it("shows no Clear link while the whole range is chosen", () => {
    expect(render("", bounds)).not.toContain("Clear");
  });

  it("is drawn in the brand colours and fills the bar between the handles", () => {
    const html = render("min=1000&max=3000", bounds);
    expect(html).toContain("bg-brand-navy");
    expect(html).toMatch(/style="[^"]*left:\s*15\.\d+%/);
    expect(html).not.toMatch(/pink|rose/);
  });

  it("still offers the typed boxes when the shop's price range is unknown", () => {
    const html = render("", undefined);
    expect(html).toContain('name="min"');
    expect(html).not.toContain('type="range"');
  });
});

describe("slider handle colours", () => {
  it("have their own colours in both themes, whether or not the theme variables exist", () => {
    const css = require("node:fs").readFileSync("src/app/globals.css", "utf8") as string;
    expect(css).toMatch(/--range-thumb,\s*#1e2235/);
    expect(css).toMatch(/\.dark \.price-range\s*{[^}]*--range-thumb:\s*#f9c92b/);
  });
});
