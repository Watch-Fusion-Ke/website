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

describe("the menu drawer as a modal", () => {
  const source = readFileSync("src/components/Menu.tsx", "utf8");

  it("moves the keyboard into the drawer when it opens and back to the menu button when it closes", () => {
    expect(source).toMatch(/setTimeout\(\(\) => closeRef\.current\?\.focus\(\), \d+\)/);
    expect(source).toMatch(/openerRef\.current\?\.focus\(\)/);
    expect(source).toContain("ref={openerRef}");
    expect(source).toContain("ref={closeRef}");
  });

  it("keeps Tab inside the drawer while it is open, going round from the last control to the first and back", () => {
    expect(source).toContain('"Tab"');
    expect(source).toContain("e.shiftKey");
  });

  it("stops the page behind it from scrolling while it is open, and gives the scroll back after", () => {
    expect(source).toContain('document.body.style.overflow = "hidden"');
    expect(source).toMatch(/document\.body\.style\.overflow = (previous|before)/);
  });

  it("shows its categories whether or not it is open, so the lists do not collapse while it slides shut", () => {
    expect(source).not.toMatch(/open \? allCats/);
  });
});
