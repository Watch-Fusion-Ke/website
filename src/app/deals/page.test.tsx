import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const productList = vi.hoisted(() => vi.fn());
vi.mock("@/components/ProductList", () => ({
  default: (props: Record<string, unknown>) => {
    productList(props);
    return <div data-testid="product-list" />;
  },
}));

import DealsPage from "@/app/deals/page";

const render = async () =>
  renderToStaticMarkup(await DealsPage({ searchParams: Promise.resolve({}) }));

describe("Deals page", () => {
  it("shows no countdown, sale tiles or discount claims that nothing in the shop backs up", async () => {
    const html = await render();
    for (const text of ["Ends in", "23h", "Flash Sales", "Bundle Offers", "Up to 50%", "LIMITED TIME", "Save big"]) {
      expect(html).not.toContain(text);
    }
  });

  it("lists only products that are really on sale", async () => {
    await render();
    expect(productList).toHaveBeenCalledWith(expect.objectContaining({ onSale: true }));
  });

  it("explains what to expect when nothing is on offer", async () => {
    await render();
    expect(productList).toHaveBeenCalledWith(
      expect.objectContaining({ emptyMessage: expect.stringMatching(/no offers/i) })
    );
  });

  it("has one main heading in the title face, and a way back to the whole shop", async () => {
    const html = await render();
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*font-display/);
    expect(html).toContain('href="/shop"');
  });

  it("uses no pink or red", async () => {
    expect(await render()).not.toMatch(/pink|red-|rose-/);
  });
});
