import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("the menu drawer's grouped categories", () => {
  const source = readFileSync("src/components/Menu.tsx", "utf8");

  it("folds a group such as Watch Brands away until it is tapped, so nine brands do not push Christmas and the gifts off the first screen", () => {
    expect(source).toContain("<details");
    expect(source).toContain("<summary");
    expect(source).not.toMatch(/<details[^>]*\bopen\b/);
  });

  it("shows the group's name as an entry like the others, with a chevron that turns when it is open", () => {
    expect(source).toContain("group-open:rotate-180");
    expect(source).toMatch(/<summary[^>]*min-h-11/);
  });
});
