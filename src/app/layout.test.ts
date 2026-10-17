import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The page is drawn under the notch (viewport-fit=cover), so the page itself has to stay inside the safe area.
describe("root layout", () => {
  const source = readFileSync("src/app/layout.tsx", "utf8");

  it("draws under the notch and then pads the page left and right", () => {
    expect(source).toContain('viewportFit: "cover"');
    expect(source).toContain("pl-[env(safe-area-inset-left)]");
    expect(source).toContain("pr-[env(safe-area-inset-right)]");
  });
});
