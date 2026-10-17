import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Footer from "@/components/Footer";

describe("Footer", () => {
  it("carries the copyright line without a year that could go stale on a page built months ago", () => {
    const html = renderToStaticMarkup(<Footer />);
    expect(html).toContain("© Watch Fusion Kenya");
    expect(html).not.toMatch(/© \d{4}/);
  });
});
