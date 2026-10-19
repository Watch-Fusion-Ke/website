import { describe, expect, it } from "vitest";
import { ELEVATE_AT, HIDE_AFTER, SCROLL_DELTA, nextHeaderState, type HeaderState } from "@/lib/headerScroll";

const top: HeaderState = { elevated: false, searchHidden: false };

describe("nextHeaderState", () => {
  it("shows the whole header, flat, at the very top, including when the page bounces above the top", () => {
    expect(nextHeaderState({ elevated: true, searchHidden: true }, 0, 300, false)).toEqual(top);
    expect(nextHeaderState({ elevated: true, searchHidden: true }, -40, 20, false)).toEqual(top);
  });

  it("lifts the header off the page with a shadow as soon as the page has moved, and not before", () => {
    expect(nextHeaderState(top, ELEVATE_AT, 0, false).elevated).toBe(false);
    expect(nextHeaderState(top, ELEVATE_AT + 1, 0, false).elevated).toBe(true);
  });

  it("folds the search row away when reading down the page, once past the top of the page", () => {
    const state = nextHeaderState({ elevated: true, searchHidden: false }, HIDE_AFTER + 50, HIDE_AFTER + 30, false);
    expect(state.searchHidden).toBe(true);
  });

  it("keeps the search row while still near the top of the page, however it is scrolled", () => {
    expect(nextHeaderState({ elevated: true, searchHidden: false }, HIDE_AFTER - 10, 20, false).searchHidden).toBe(false);
  });

  it("brings the search row back at the first scroll upwards", () => {
    const state = nextHeaderState({ elevated: true, searchHidden: true }, 900, 900 + SCROLL_DELTA + 1, false);
    expect(state.searchHidden).toBe(false);
  });

  it("ignores tiny movements, so a trembling finger does not make the header flicker", () => {
    const hidden = { elevated: true, searchHidden: true };
    expect(nextHeaderState(hidden, 900, 900 + SCROLL_DELTA - 1, false)).toEqual(hidden);
    const shown = { elevated: true, searchHidden: false };
    expect(nextHeaderState(shown, 900 + SCROLL_DELTA - 1, 900, false)).toEqual(shown);
  });

  it("never folds the search row away while the shopper is using it", () => {
    const state = nextHeaderState({ elevated: true, searchHidden: false }, 900, 800, true);
    expect(state.searchHidden).toBe(false);
  });

  it("returns the same object when nothing changed, so the page does not redraw for nothing", () => {
    const same = { elevated: true, searchHidden: true };
    expect(nextHeaderState(same, 900, 900, false)).toBe(same);
  });
});
