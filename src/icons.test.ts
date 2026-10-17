import { existsSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pngSize = (file: string) => {
  const b = readFileSync(file);
  expect(b.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};

describe("site icons", () => {
  it("has an SVG icon of the W mark on a dark tile, so it shows in both light and dark browser tabs", () => {
    const svg = readFileSync("src/app/icon.svg", "utf8");
    expect(svg).toMatch(/^<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"[^>]*viewBox="[\d. ]+"/);
    expect(svg).toMatch(/<rect[^>]*fill="#0a0a0a"/);
    expect(svg).toMatch(/fill="#(ffc615|fec615|fec514)"/i);
    expect(svg).toMatch(/fill="#ffffff"/i);
    expect((svg.match(/<path/g) ?? []).length).toBeGreaterThan(5);
  });

  it("is small enough for a browser tab icon", () => {
    expect(statSync("src/app/icon.svg").size).toBeLessThan(20_000);
  });

  it("holds no script, no external link and no text, since an icon is only a picture", () => {
    const svg = readFileSync("src/app/icon.svg", "utf8");
    expect(svg).not.toMatch(/<script|href=|<text|<image|<foreignObject/i);
  });

  it("has a 180 pixel square touch icon for iPhones", () => {
    expect(existsSync("src/app/apple-icon.png")).toBe(true);
    expect(pngSize("src/app/apple-icon.png")).toEqual({ w: 180, h: 180 });
  });

  it("has a favicon.ico that holds a 32 pixel picture, for browsers that ask for it by name", () => {
    const ico = readFileSync("src/app/favicon.ico");
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBeGreaterThanOrEqual(1);
    expect(ico[6]).toBe(32);
    const offset = ico.readUInt32LE(18);
    expect(ico.subarray(offset, offset + 8).toString("hex")).toBe("89504e470d0a1a0a");
  });
});
