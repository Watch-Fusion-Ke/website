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
      expect(source).toMatch(/export const metadata|export async function generateMetadata/);
      expect(source).toMatch(/title:\s*["'][^"']+["']/);
      expect(source).toMatch(/description:\s*"[^"]{40,}"/);
    }
  });
});

describe("the picture shown when a link to the shop is shared", () => {
  const layout = read("src/app/layout.tsx");

  it("is a card of its own on the brand navy, not the white-lettered logo, which is invisible on a white link card", () => {
    expect(layout).not.toMatch(/images:\s*\[\s*\{\s*url:\s*"\/logo\.png"/);
    expect(layout).not.toMatch(/images:\s*\["\/logo\.png"\]/);
    expect(layout).toContain('url: "/share-image.png"');
    expect(layout).toContain('images: ["/share-image.png"]');
  });

  it("is the 1200 by 630 size link previews ask for, and the file is that size and a real PNG", () => {
    expect(layout).toMatch(/width:\s*1200,\s*height:\s*630/);
    const png = readFileSync("public/share-image.png");
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });

  it("is a small file, so a chat app does not skip it", () => {
    expect(readFileSync("public/share-image.png").length).toBeLessThan(300_000);
  });
});
