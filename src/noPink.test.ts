import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The brand is navy and gold. The pink and purple of the original template must not come back.
// Red stays for errors and the remove button. Pages still waiting for their own redesign are listed
// here and must be taken off the list when they are done.
const WAITING_FOR_REDESIGN = new Set(["src/app/contact/page.tsx", "src/app/deals/page.tsx"]);

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? sourceFiles(join(dir, entry.name))
      : /\.(tsx?|css)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
        ? [join(dir, entry.name)]
        : []
  );

const OFF_BRAND = /\b(?:[a-z-]+:)*(?:bg|text|ring|border|from|to|via|fill|stroke|outline|shadow|accent|divide|placeholder|decoration)-(?:pink|rose|purple|fuchsia|lama)\b|\blama\b/i;

// Any hex colour in the pink to purple range (hue 280 to 350 degrees, clearly coloured), however it is written.
const isPinkHex = (hex: string): boolean => {
  const n = parseInt(hex.length === 4 ? hex.slice(1).replace(/./g, "$&$&") : hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return false;
  const l = (max + min) / 2, sat = d / (1 - Math.abs(2 * l - 1));
  const hue = (max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
  const h = (hue + 360) % 360;
  return sat > 0.2 && h >= 280 && h <= 350;
};

describe("colours", () => {
  it("use no pink, rose, purple or the old template pink", () => {
    const found: string[] = [];
    for (const file of [...sourceFiles("src"), "tailwind.config.ts"]) {
      if (WAITING_FOR_REDESIGN.has(file)) continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          const pinkHex = (line.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) ?? []).some(isPinkHex);
          if (OFF_BRAND.test(line) || pinkHex) found.push(`${file}:${i + 1} ${line.trim().slice(0, 90)}`);
        });
    }
    expect(found).toEqual([]);
  });

  it("give action buttons the brand navy, not the template's black with a grey hover", () => {
    const found: string[] = [];
    for (const file of sourceFiles("src")) {
      if (WAITING_FOR_REDESIGN.has(file)) continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/hover:bg-gray-800/.test(line)) found.push(`${file}:${i + 1}`);
        });
    }
    expect(found).toEqual([]);
  });

  it("keep disabled buttons readable, with dark text on a light grey and not white on grey", () => {
    const found: string[] = [];
    for (const file of sourceFiles("src")) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/disabled:bg-gray-[2-4]00/.test(line) && /disabled:text-white|text-white/.test(line) && !/disabled:text-gray-/.test(line))
            found.push(`${file}:${i + 1}`);
        });
    }
    expect(found).toEqual([]);
  });

  it("name the shop correctly in the footer logo", () => {
    expect(readFileSync("src/components/Footer.tsx", "utf8")).not.toContain("TrendLama");
  });

  it("do not set gold as text colour on a light page", () => {
    const found: string[] = [];
    for (const file of sourceFiles("src")) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/hover:text-(?:yellow-400|brand-gold)\b/.test(line) && !/bg-(?:black|brand-black|brand-navy)/.test(line) && !file.includes("Footer"))
            found.push(`${file}:${i + 1}`);
        });
    }
    expect(found).toEqual([]);
  });
});
