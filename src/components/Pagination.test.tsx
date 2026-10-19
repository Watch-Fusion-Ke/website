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

  it("shows only the buttons that lead somewhere: no Next on the last page, no Previous on the first", () => {
    const first = renderToStaticMarkup(<Pagination currentPage={0} hasPrev={false} hasNext />);
    expect(first).toContain(">Next<");
    expect(first).not.toContain("Previous");
    const last = renderToStaticMarkup(<Pagination currentPage={3} hasPrev hasNext={false} />);
    expect(last).toContain(">Previous<");
    expect(last).not.toContain("Next");
    const middle = renderToStaticMarkup(<Pagination currentPage={1} hasPrev hasNext />);
    expect(middle).toContain(">Previous<");
    expect(middle).toContain(">Next<");
  });

  it("shows nothing at all when there is only one page", () => {
    expect(renderToStaticMarkup(<Pagination currentPage={0} hasPrev={false} hasNext={false} />)).toBe("");
  });

  it("keeps Next on the right even when it is the only button", () => {
    const html = renderToStaticMarkup(<Pagination currentPage={0} hasPrev={false} hasNext />);
    expect(html.match(/<button[^>]*>/)?.[0]).toContain("ml-auto");
  });

  it("never leaves a button that is shown but cannot be pressed", () => {
    for (const [prev, next] of [[true, true], [true, false], [false, true]] as const) {
      expect(renderToStaticMarkup(<Pagination currentPage={1} hasPrev={prev} hasNext={next} />)).not.toContain('disabled=""');
    }
  });
});
