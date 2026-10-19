import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STORES_APP_ID } from "@/lib/wixApps";

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });

describe("STORES_APP_ID", () => {
  it("is the Wix Stores app, which every product added to a cart comes from", () => {
    expect(STORES_APP_ID).toBe("215238eb-22a5-4c36-9e7b-e7c08025e04e");
  });

  it("is used when adding to the cart, not a value from the environment", () => {
    const store = readFileSync(join(process.cwd(), "src/hooks/useCartStore.ts"), "utf8");
    expect(store).toContain("STORES_APP_ID");
  });

  it("is not read from an environment variable anywhere, since pasting the OAuth client id there silently empties every cart", () => {
    const offenders = sourceFiles(join(process.cwd(), "src")).filter((file) => readFileSync(file, "utf8").includes("NEXT_PUBLIC_WIX_APP_ID"));
    expect(offenders).toEqual([]);
  });
});
