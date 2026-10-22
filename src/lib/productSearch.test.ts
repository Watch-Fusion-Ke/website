import { describe, expect, it } from "vitest";
import { MAX_QUERY, canSearch, cleanQuery, shopSearchHref } from "@/lib/productSearch";

describe("what a shopper types into the search", () => {
  it("is trimmed and its spaces squeezed, so 'casio   vintage ' reads as 'casio vintage'", () => {
    expect(cleanQuery("  casio   vintage ")).toBe("casio vintage");
  });

  it("is cut to a sensible length, so a pasted essay never reaches the shop's search", () => {
    expect(cleanQuery("a".repeat(500))).toHaveLength(MAX_QUERY);
  });

  it("starts searching from two letters, not one, so the list is not a flood of the whole shop", () => {
    expect(canSearch("c")).toBe(false);
    expect(canSearch(" c ")).toBe(false);
    expect(canSearch("ca")).toBe(true);
  });

  it("goes to the shop's own results page, with the words safely encoded", () => {
    expect(shopSearchHref("casio mtp")).toBe("/shop?name=casio%20mtp");
    expect(shopSearchHref("a&b=c")).toBe("/shop?name=a%26b%3Dc");
  });
});
