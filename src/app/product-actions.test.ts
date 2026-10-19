import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("product page buttons", () => {
  const source = readFileSync("src/app/[slug]/page.tsx", "utf8");

  it("keeps Order on WhatsApp directly under Add to Cart, in one tight group", () => {
    const group = source.match(/<div className="flex flex-col gap-3">([\s\S]*?)<\/div>\s*\n\s*<div className="h-\[2px\]/)?.[1] ?? "";
    expect(group).toContain("<Add");
    expect(group).toContain("<CustomizeProducts");
    expect(group.indexOf("<Add")).toBeLessThan(group.indexOf("<OrderOnWhatsApp"));
    expect(group.indexOf("<CustomizeProducts")).toBeLessThan(group.indexOf("<OrderOnWhatsApp"));
  });
});
