import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hideWhileScrolling } from "@/lib/scrollHider";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const setup = (delay?: number) => {
  const target = new EventTarget();
  const states: boolean[] = [];
  const stop = hideWhileScrolling(target, (hidden) => states.push(hidden), delay);
  return { target, states, stop };
};

describe("hideWhileScrolling", () => {
  it("does nothing until the page scrolls", () => {
    const { states } = setup();
    vi.advanceTimersByTime(5000);
    expect(states).toEqual([]);
  });

  it("hides at the first scroll and shows again once scrolling has stopped for the delay", () => {
    const { target, states } = setup(700);
    target.dispatchEvent(new Event("scroll"));
    expect(states).toEqual([true]);
    vi.advanceTimersByTime(699);
    expect(states).toEqual([true]);
    vi.advanceTimersByTime(1);
    expect(states).toEqual([true, false]);
  });

  it("stays hidden while the scrolling goes on", () => {
    const { target, states } = setup(700);
    for (let i = 0; i < 5; i++) {
      target.dispatchEvent(new Event("scroll"));
      vi.advanceTimersByTime(400);
    }
    expect(states.filter((s) => s === false)).toHaveLength(0);
    vi.advanceTimersByTime(700);
    expect(states.at(-1)).toBe(false);
  });

  it("stops listening and cancels the timer when removed", () => {
    const { target, states, stop } = setup(700);
    target.dispatchEvent(new Event("scroll"));
    stop();
    vi.advanceTimersByTime(2000);
    target.dispatchEvent(new Event("scroll"));
    expect(states).toEqual([true]);
  });
});
