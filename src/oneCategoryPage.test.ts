import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "../next.config.mjs";

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });

describe("one page for every category", () => {
  it("has no second listing page, so the category pills are always on the page that lists the products", () => {
    expect(existsSync("src/app/list")).toBe(false);
  });

  it("sends the old /list address to the shop for good, keeping the category or search in the address", async () => {
    const redirects = await (nextConfig as { redirects?: () => Promise<{ source: string; destination: string; permanent: boolean }[]> }).redirects?.();
    const rule = redirects?.find((r) => r.source === "/list");
    expect(rule).toEqual({ source: "/list", destination: "/shop", permanent: true });
  });

  it("points every link and search to /shop, never to /list", () => {
    const offenders = sourceFiles("src").filter((f) => /["'`]\/list[?"'`]/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
