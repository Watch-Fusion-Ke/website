import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("category names above the banner", () => {
  const source = readFileSync("src/components/CategoryList.tsx", "utf8");

  it("take the site font instead of a font of their own", () => {
    expect(source).not.toMatch(/fontFamily|Futura/);
  });

  it("are not marked as main page headings", () => {
    expect(source).not.toMatch(/<h1[\s>]/);
  });
});
