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
