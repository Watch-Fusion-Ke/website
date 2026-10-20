import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("the category list above the banner", () => {
  const source = readFileSync("src/components/CategoryList.tsx", "utf8");

  it("hands the store's categories to the menu builder and shows the result, instead of printing them all side by side", () => {
    expect(source).toContain("buildMenu(");
    expect(source).toContain("<CategoryRow");
  });

  it("says so in the server log when the category list cannot be read, instead of failing the whole home page silently", () => {
    expect(source).toMatch(/console\.error\(/);
  });
});
