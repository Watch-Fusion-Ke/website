import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/shop",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: () => {} }),
}));

import Pagination from "@/components/Pagination";

describe("Pagination", () => {
  it("draws Previous and Next in the brand navy and never in pink", () => {
    const html = renderToStaticMarkup(<Pagination currentPage={1} hasPrev hasNext />);
    expect(html.match(/bg-brand-navy/g)).toHaveLength(2);
    expect(html).not.toMatch(/pink|F35C7A/i);
  });

  it("greys out a button that cannot be used and disables it", () => {
    const html = renderToStaticMarkup(<Pagination currentPage={0} hasPrev={false} hasNext />);
    expect(html.match(/disabled=""/g)).toHaveLength(1);
    expect(html).toContain("disabled:bg-gray-200");
  });
});
