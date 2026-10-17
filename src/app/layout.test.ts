import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The page is drawn under the notch (viewport-fit=cover), so the page itself has to stay inside the safe area.
describe("root layout", () => {
  const source = readFileSync("src/app/layout.tsx", "utf8");
  const bodyTag = source.match(/<body\s+className=\{`([^`]*)`\}/)?.[1] ?? "";

  it("draws under the notch", () => {
    expect(source).toContain('viewportFit: "cover"');
  });

  it("pads the body, not some other element, left and right", () => {
    expect(bodyTag).toContain("pl-[env(safe-area-inset-left)]");
    expect(bodyTag).toContain("pr-[env(safe-area-inset-right)]");
  });
});

describe("fonts", () => {
  const source = readFileSync("src/app/layout.tsx", "utf8");
  const bodyTag = source.match(/<body\s+className=\{`([^`]*)`\}/)?.[1] ?? "";

  it("uses Montserrat for the text and a serif display face for headings, both loaded with next/font", () => {
    expect(source).toMatch(/Montserrat\(/);
    expect(source).toMatch(/Cormorant_Garamond\(/);
    expect(source).not.toMatch(/Jost/);
  });

  it("puts both font variables on the body and sets the text font", () => {
    expect(bodyTag).toContain("montserrat.variable");
    expect(bodyTag).toContain("cormorant.variable");
    expect(bodyTag).toContain("font-sans");
  });
});
