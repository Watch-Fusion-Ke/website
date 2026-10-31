import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });

describe("the public repository", () => {
  // Listing the repository's files can take longer than the default five seconds on a busy machine, which made this test fail at random.
  it("holds no editor settings or personal tool settings", () => {
    const tracked = execSync("git ls-files", { encoding: "utf8" }).split("\n");
    expect(tracked.filter((f) => f.startsWith(".idea/") || f === ".claude/settings.json" || f.startsWith(".claude/settings"))).toEqual([]);
  }, 30_000);

  it("keeps those folders out in future", () => {
    const ignore = readFileSync(".gitignore", "utf8");
    expect(ignore).toMatch(/^\/?\.idea\/?$/m);
    expect(ignore).toMatch(/^\/?\.claude\/settings\.json$/m);
    expect(ignore).toMatch(/^\/?\.claude\/settings\.local\.json$/m);
  });

  it("does not log what a member typed or what Wix answered, which can include personal details", () => {
    const offenders = sourceFiles("src").filter((f) => /console\.log\(/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("has no leftover template page for the shop to be found at /home", () => {
    expect(existsSync("src/app/home")).toBe(false);
  });

  it("has no unused copy of the same picture in two places", () => {
    expect(existsSync("public/cap1.jpeg") && existsSync("public/products/cap1.jpeg")).toBe(false);
  });
});
