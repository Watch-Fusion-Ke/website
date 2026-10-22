import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }));

import SearchBar from "@/components/SearchBar";

describe("the search box in the header", () => {
  const html = renderToStaticMarkup(<SearchBar />);

  it("is a box that opens the search page instead of searching in place", () => {
    const source = readFileSync("src/components/SearchBar.tsx", "utf8");
    expect(source).toContain("OPEN_SEARCH_EVENT");
    expect(source).toContain("dispatchEvent");
    expect(html).toMatch(/<input[^>]*readonly/i);
  });

  it("keeps its name and label, so the header still has a search field", () => {
    expect(html).toContain('name="name"');
    expect(html).toContain('aria-label="Search watches"');
    expect(html).toContain('placeholder="Search watches"');
  });

  it("tells assistive technology that it opens a dialog", () => {
    expect(html).toContain('aria-haspopup="dialog"');
  });

  it("opens by click, Enter or Space, never by merely receiving focus, so closing the page does not reopen it", () => {
    const source = readFileSync("src/components/SearchBar.tsx", "utf8");
    expect(source).toContain("onClick");
    expect(source).not.toContain("onFocus");
  });
});
