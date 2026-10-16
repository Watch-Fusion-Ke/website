import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The site uses drawn icons, not emoji. Product text that shop staff type into Wix is not checked here.
const ALLOWED = new Set(["©", "®", "™"]); // copyright, registered, trademark signs

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? sourceFiles(join(dir, entry.name))
      : /\.(tsx?|css)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
        ? [join(dir, entry.name)]
        : []
  );

describe("source files", () => {
  it("contain no emoji", () => {
    const found: string[] = [];
    for (const file of sourceFiles("src")) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          Array.from(line.matchAll(/\p{Extended_Pictographic}/gu)).forEach((match) => {
            if (!ALLOWED.has(match[0])) found.push(`${file}:${i + 1} ${match[0]}`);
          });
        });
    }
    expect(found).toEqual([]);
  });
});
