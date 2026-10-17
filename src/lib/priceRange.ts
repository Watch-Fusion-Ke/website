export type Bounds = { min: number; max: number };
export type Range = { lo: number; hi: number };

export const PRICE_STEP = 100;

// The cheapest price rounded down and the dearest rounded up to the step, or nothing when there is no usable range.
export const roundBounds = (cheapest: number, dearest: number, step = PRICE_STEP): Bounds | null => {
  if (!Number.isFinite(cheapest) || !Number.isFinite(dearest)) return null;
  const min = Math.max(0, Math.floor(cheapest / step) * step);
  const max = Math.ceil(dearest / step) * step;
  return max > min ? { min, max } : null;
};

const snap = (v: number, step: number) => Math.round(v / step) * step;

// Keeps both handles inside the bounds, in order, on the step, and at least one step apart.
export const clampRange = (a: number, b: number, bounds: Bounds, step = PRICE_STEP): Range => {
  const inside = (v: number) => Math.min(bounds.max, Math.max(bounds.min, snap(v, step)));
  let lo = inside(Math.min(a, b));
  let hi = inside(Math.max(a, b));
  if (hi - lo < step) {
    if (hi + step <= bounds.max) hi = lo + step;
    else lo = hi - step;
  }
  return { lo, hi };
};

// An end sitting at the edge of the bounds means "no limit", so the whole range is no filter at all.
export const rangeToParams = (range: Range, bounds: Bounds): { min: string; max: string } => ({
  min: range.lo <= bounds.min ? "" : String(range.lo),
  max: range.hi >= bounds.max ? "" : String(range.hi),
});

// Where a price sits along the bar, from 0 to 100.
export const fillPercent = (value: number, bounds: Bounds): number =>
  Math.min(100, Math.max(0, ((value - bounds.min) / (bounds.max - bounds.min)) * 100));

export const formatPrice = (n: number): string => `KES ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
