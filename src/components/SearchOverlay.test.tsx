import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SearchOverlayView } from "@/components/SearchOverlay";

const item = (n: number, over: Record<string, unknown> = {}) => ({
  id: `id-${n}`,
  slug: `watch-${n}`,
  name: `Casio Watch ${n}`,
  imageUrl: `https://static.wixstatic.com/media/${n}.jpg`,
  priceLabel: "KES 6,500",
  compareAtLabel: null,
  ...over,
});
const view = (props: Partial<React.ComponentProps<typeof SearchOverlayView>> = {}) =>
  renderToStaticMarkup(
    <SearchOverlayView query="" status="idle" items={[]} hasMore={false} onQuery={() => {}} onSubmit={() => {}} onClose={() => {}} onNavigate={() => {}} {...props} />
  );

describe("the search page", () => {
  it("is a dialog that covers the page, with a name", () => {
    const html = view();
    expect(html).toMatch(/role="dialog"/);
    expect(html).toContain('aria-modal="true"');
    expect(html).toMatch(/aria-label="Search the shop"/);
    expect(html).toMatch(/class="[^"]*\bfixed\b[^"]*\binset-0\b/);
  });

  it("has a clear way out: a labelled Close button that is a full tap target", () => {
    const html = view();
    const close = html.match(/<button[^>]*aria-label="Close search"[^>]*>/)?.[0] ?? "";
    expect(close).not.toBe("");
    expect(close).toContain('type="button"');
    expect(close).toMatch(/min-h-11/);
    expect(close).toMatch(/min-w-11/);
  });

  it("has a search field that starts focused, with the name the shop's search page reads", () => {
    const input = view().match(/<input[^>]*>/)?.[0] ?? "";
    expect(input).toContain('type="search"');
    expect(input).toContain('name="name"');
    expect(input).toContain('aria-label="Search watches"');
    expect(input).toContain('autoComplete="off"');
    expect(input).toMatch(/enterKeyHint="search"/);
  });

  it("asks for at least two letters before there is anything to show", () => {
    expect(view()).toMatch(/at least two letters/i);
  });

  it("says it is searching, in a polite live region", () => {
    const html = view({ query: "cas", status: "loading" });
    expect(html).toMatch(/aria-live="polite"/);
    expect(html).toMatch(/Searching/);
  });

  it("lists the matches as links to each product, with photo, name and price, as the shopper types", () => {
    const html = view({ query: "casio", status: "done", items: [item(1), item(2, { priceLabel: "KES 3,000", compareAtLabel: "KES 4,000" })] });
    expect(html).toContain('href="/watch-1"');
    expect(html).toContain('href="/watch-2"');
    expect(html).toContain("Casio Watch 1");
    expect(html).toContain("KES 6,500");
    expect(html).toContain("static.wixstatic.com");
    expect(html).toMatch(/Was KES 4,000\. Now KES 3,000/);
  });

  it("tells a screen reader how many were found", () => {
    expect(view({ query: "casio", status: "done", items: [item(1), item(2)] })).toMatch(/2 watches found/);
    expect(view({ query: "casio", status: "done", items: [item(1)] })).toMatch(/1 watch found/);
  });

  it("offers to see every result in the shop, which is where Enter goes too", () => {
    const html = view({ query: "casio mtp", status: "done", items: [item(1)], hasMore: true });
    expect(html).toContain('href="/shop?name=casio%20mtp"');
    expect(html).toMatch(/See all results/);
  });

  it("says when nothing fits and still offers the whole shop", () => {
    const html = view({ query: "zzzz", status: "done", items: [] });
    expect(html).toMatch(/No watches match/);
    expect(html).toContain('href="/shop"');
  });

  it("says when the search could not run and still offers the whole shop", () => {
    const html = view({ query: "casio", status: "error" });
    expect(html).toMatch(/could not search/i);
    expect(html).toContain('href="/shop"');
  });

  it("closes the page when a result is followed", () => {
    expect(readFileSync("src/components/SearchOverlay.tsx", "utf8")).toMatch(/onClick=\{onNavigate\}/);
  });

  it("gives the magnifier button a full-size tap area", () => {
    const button = view().match(/<button[^>]*aria-label="Search"[^>]*>/)?.[0] ?? "";
    expect(button).toMatch(/min-h-11/);
    expect(button).toMatch(/min-w-11/);
  });

  it("is a form, so Enter or the search button takes the shopper to the shop's results", () => {
    expect(view()).toMatch(/<form/);
    expect(view()).toMatch(/aria-label="Search"/);
  });
});

describe("how the search page behaves", () => {
  const source = readFileSync("src/components/SearchOverlay.tsx", "utf8");

  it("closes on Escape, keeps Tab inside, locks the page behind it and gives focus back", () => {
    expect(source).toContain('"Escape"');
    expect(source).toContain('"Tab"');
    expect(source).toMatch(/overflow\s*=\s*"hidden"/);
    expect(source).toMatch(/\.focus\(\)/);
  });

  it("does not pull focus back to the header's search box when the shopper has gone to another page", () => {
    expect(source).toContain("skipRestore");
  });

  it("waits a moment after typing and drops an answer that is out of date", () => {
    expect(source).toMatch(/setTimeout\(/);
    expect(source).toContain("AbortController");
    expect(source).toContain("/api/search?q=");
  });

  it("sits above the header, the tab bar and the chat button", () => {
    const z = Number(source.match(/z-\[(\d+)\]/)?.[1]);
    expect(z).toBeGreaterThan(Number(readFileSync("src/components/ProductImages.tsx", "utf8").match(/z-\[(\d+)\]/)?.[1]));
  });

  it("closes when the page changes, and opens when asked by the header's search box", () => {
    expect(source).toContain("usePathname");
    expect(source).toContain("OPEN_SEARCH_EVENT");
  });

  it("uses the theme's page colour, so it works in the dark theme", () => {
    expect(source).toContain("bg-[var(--page)]");
  });

  it("is on every page", () => {
    expect(readFileSync("src/app/layout.tsx", "utf8")).toMatch(/<SearchOverlay \/>/);
  });
});
