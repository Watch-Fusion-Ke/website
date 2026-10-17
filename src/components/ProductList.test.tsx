import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listProducts = vi.hoisted(() => vi.fn());
vi.mock("@/lib/storeProducts", () => ({ listProducts }));
vi.mock("@/lib/wixClientServer", () => ({
  wixClientServer: async () => ({
    fetchWithAuth: async () => new Response("{}"),
    collections: { queryCollections: () => ({ find: async () => ({ items: [] }) }) },
  }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/deals",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: () => {} }),
}));

import ProductList from "@/components/ProductList";

const card = { id: "1", slug: "a", name: "A", imageUrl: null, hoverImageUrl: null, priceLabel: "KES 1", compareAtLabel: null, discountPercent: null };
const render = async (props: Record<string, unknown>) =>
  renderToStaticMarkup(await ProductList({ categoryId: "", ...props }));

beforeEach(() => listProducts.mockReset());

describe("ProductList", () => {
  it("asks for sale products only when told to", async () => {
    listProducts.mockResolvedValue({ items: [card], page: 0, hasPrev: false, hasNext: false });
    await render({ onSale: true });
    expect(listProducts).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ onSale: true }));
    await render({});
    expect(listProducts).toHaveBeenLastCalledWith(expect.any(Function), expect.objectContaining({ onSale: undefined }));
  });

  it("says so when the list is empty, using the page's own message when it has one", async () => {
    listProducts.mockResolvedValue({ items: [], page: 0, hasPrev: false, hasNext: false });
    expect(await render({})).toContain("No products found.");
    expect(await render({ emptyMessage: "No offers today." })).toContain("No offers today.");
  });

  it("keeps the Previous button when a filter leaves an empty page past the end, so the shopper can get back", async () => {
    listProducts.mockResolvedValue({ items: [], page: 2, hasPrev: true, hasNext: false });
    const html = await render({});
    expect(html).toContain("Previous");
    expect(html).not.toMatch(/<button[^>]*disabled=""[^>]*>Previous/);
  });
});
