import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("canonical links", () => {
  it("are not set once for the whole site, which would make every page claim to be the home page", () => {
    expect(read("src/app/layout.tsx")).not.toMatch(/canonical/);
  });

  it("name each main page as itself", () => {
    expect(read("src/app/page.tsx")).toMatch(/canonical:\s*["']\/["']/);
    for (const [file, path] of [
      ["src/app/shop/page.tsx", "/shop"],
      ["src/app/deals/page.tsx", "/deals"],
      ["src/app/contact/page.tsx", "/contact"],
    ]) {
      expect(read(file)).toMatch(new RegExp(`canonical:\\s*["']${path}["']`));
    }
  });
});

describe("page titles", () => {
  it("give the shop, deals and contact pages a title and a description of their own", () => {
    for (const file of ["src/app/shop/page.tsx", "src/app/deals/page.tsx", "src/app/contact/page.tsx"]) {
      const source = read(file);
      expect(source).toMatch(/export const metadata/);
      expect(source).toMatch(/title:\s*["'][^"']+["']/);
      expect(source).toMatch(/description:\s*["'][^"']{40,}["']/);
    }
  });
});
