import { describe, expect, it } from "vitest";
import { clampRange, fillPercent, rangeToParams, roundBounds } from "@/lib/priceRange";

describe("roundBounds", () => {
  it("rounds the cheapest down and the dearest up to the step", () => {
    expect(roundBounds(10, 6500, 100)).toEqual({ min: 0, max: 6500 });
    expect(roundBounds(2950, 4510, 100)).toEqual({ min: 2900, max: 4600 });
  });

  it("gives nothing when there is no usable range", () => {
    expect(roundBounds(Number.NaN, 100, 100)).toBeNull();
    expect(roundBounds(500, 500, 100)).toBeNull();
    expect(roundBounds(900, 100, 100)).toBeNull();
  });
});

describe("clampRange", () => {
  const b = { min: 0, max: 6500 };
  it("keeps both handles inside the bounds and in order, snapped to the step", () => {
    expect(clampRange(-50, 99999, b, 100)).toEqual({ lo: 0, hi: 6500 });
    expect(clampRange(4000, 1000, b, 100)).toEqual({ lo: 1000, hi: 4000 });
    expect(clampRange(1234, 4321, b, 100)).toEqual({ lo: 1200, hi: 4300 });
  });

  it("never lets the handles meet", () => {
    const r = clampRange(3000, 3000, b, 100);
    expect(r.hi - r.lo).toBeGreaterThanOrEqual(100);
  });
});

describe("rangeToParams", () => {
  const b = { min: 0, max: 6500 };
  it("sends nothing for an end that sits at the edge of the bounds, so the whole range is no filter", () => {
    expect(rangeToParams({ lo: 0, hi: 6500 }, b)).toEqual({ min: "", max: "" });
    expect(rangeToParams({ lo: 2000, hi: 6500 }, b)).toEqual({ min: "2000", max: "" });
    expect(rangeToParams({ lo: 0, hi: 4000 }, b)).toEqual({ min: "", max: "4000" });
    expect(rangeToParams({ lo: 2000, hi: 4000 }, b)).toEqual({ min: "2000", max: "4000" });
  });
});

describe("fillPercent", () => {
  it("places a value along the track from 0 to 100", () => {
    const b = { min: 0, max: 6500 };
    expect(fillPercent(0, b)).toBe(0);
    expect(fillPercent(3250, b)).toBe(50);
    expect(fillPercent(6500, b)).toBe(100);
    expect(fillPercent(9999, b)).toBe(100);
  });
});
