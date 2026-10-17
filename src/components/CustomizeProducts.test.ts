import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("size and colour choice pills", () => {
  const source = readFileSync("src/components/CustomizeProducts.tsx", "utf8");

  it("take their colours from the theme, not from fixed white and hex values", () => {
    const style = source.match(/style=\{\{[\s\S]*?boxShadow/)?.[0] ?? "";
    expect(style).not.toMatch(/"white"|"#[0-9A-Fa-f]{6}"/);
    expect(style).toContain("var(--choice-bg)");
    expect(style).toContain("var(--choice-on-bg)");
  });
});
