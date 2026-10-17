import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : /\.tsx?$/.test(e.name) && !/\.test\./.test(e.name) ? [join(dir, e.name)] : []
  );

describe("the Wix admin login", () => {
  it("is never imported by a file that runs in the browser, so the secret cannot reach a visitor", () => {
    const offenders = files("src").filter((f) => {
      const text = readFileSync(f, "utf8");
      return /^\s*["']use client["']/m.test(text.split("\n").slice(0, 3).join("\n")) && /wixAdmin|WIX_CLIENT_SECRET/.test(text);
    });
    expect(offenders).toEqual([]);
  });

  it("is the only place that reads the client secret", () => {
    const readers = files("src").filter((f) => readFileSync(f, "utf8").includes("WIX_CLIENT_SECRET") && !f.endsWith("wixAdmin.ts"));
    expect(readers).toEqual([]);
  });

  it("is imported by the delivery route and nothing else, so no other file can pass it on to the browser", () => {
    const importers = files("src").filter((f) => /from ["']@\/lib\/wixAdmin["']/.test(readFileSync(f, "utf8")));
    expect(importers).toEqual(["src/app/api/delivery/route.ts"]);
  });
});
