import { describe, expect, it } from "vitest";
import { rowDelayMs, startingPhase } from "@/lib/specReveal";

const below = { hasObserver: true, reducedMotion: false, top: 1200, viewportHeight: 844 };

describe("startingPhase", () => {
  it("waits for the table to be reached when it starts below the fold", () => {
    expect(startingPhase(below)).toBe("armed");
  });

  it("leaves the table as it is when it is already on screen, so it is not hidden and then played in", () => {
    expect(startingPhase({ ...below, top: 300 })).toBe("static");
  });

  it("leaves it as it is when the visitor has already scrolled past it", () => {
    expect(startingPhase({ ...below, top: -900 })).toBe("static");
  });

  it("leaves it as it is for people who ask their device for less motion", () => {
    expect(startingPhase({ ...below, reducedMotion: true })).toBe("static");
  });

  it("leaves it as it is when the browser cannot watch for scrolling", () => {
    expect(startingPhase({ ...below, hasObserver: false })).toBe("static");
  });
});

describe("the reveal timing", () => {
  it("staggers the rows 45 ms apart after a short pause, and stops adding delay after the twelfth", () => {
    expect(rowDelayMs(0)).toBe(250);
    expect(rowDelayMs(1)).toBe(295);
    expect(rowDelayMs(12)).toBe(rowDelayMs(40));
  });
});
