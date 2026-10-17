import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Uses the real product search against a store that answers with an error.
vi.mock("@/lib/wixClientServer", () => ({
  wixClientServer: async () => ({
    fetchWithAuth: async () => new Response(JSON.stringify({ message: "down" }), { status: 500 }),
    collections: { queryCollections: () => ({ find: async () => ({ items: [] }) }) },
  }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/shop",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: () => {} }),
}));

import ProductList from "@/components/ProductList";

describe("ProductList when the store is down", () => {
  it("says the products could not be loaded, not that there are none", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const html = renderToStaticMarkup(await ProductList({ categoryId: "" }));
    logged.mockRestore();
    expect(html).toContain("could not load");
    expect(html).not.toContain("No products found.");
  });
});
