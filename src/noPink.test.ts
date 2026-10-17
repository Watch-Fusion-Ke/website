import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The brand is navy and gold. The pink and purple of the original template must not come back.
// Red stays for errors and the remove button. Pages still waiting for their own redesign are listed
// here and must be taken off the list when they are done.
const WAITING_FOR_REDESIGN = new Set(["src/app/contact/page.tsx"]);

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? sourceFiles(join(dir, entry.name))
      : /\.(tsx?|css)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
        ? [join(dir, entry.name)]
        : []
  );

const OFF_BRAND = /\b(?:bg|text|ring|border|from|to|via|hover:text|hover:bg|disabled:bg)-(?:pink|rose|purple|fuchsia|lama)\b|#F35C7A|#d14d66|\blama\b/i;

describe("colours", () => {
  it("use no pink, rose, purple or the old template pink", () => {
    const found: string[] = [];
    for (const file of [...sourceFiles("src"), "tailwind.config.ts"]) {
      if (WAITING_FOR_REDESIGN.has(file)) continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (OFF_BRAND.test(line)) found.push(`${file}:${i + 1} ${line.trim().slice(0, 90)}`);
        });
    }
    expect(found).toEqual([]);
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
