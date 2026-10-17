import { describe, expect, it } from "vitest";
import { AUTOPLAY_MS, galleryReducer, initialGallery, keyAction, visibleSlots } from "@/lib/gallery";

describe("visibleSlots", () => {
  it("shows nothing for no photos and only the current one for a single photo", () => {
    expect(visibleSlots(0, 0)).toEqual([]);
    expect(visibleSlots(0, 1)).toEqual([{ index: 0, role: "current" }]);
  });

  it("shows the current photo and the other one beside it when there are two", () => {
    expect(visibleSlots(0, 2)).toEqual([
      { index: 0, role: "current" },
      { index: 1, role: "next" },
    ]);
    expect(visibleSlots(1, 2)).toEqual([
      { index: 0, role: "previous" },
      { index: 1, role: "current" },
    ]);
  });

  it("puts the current photo in the middle of three", () => {
    expect(visibleSlots(2, 6)).toEqual([
      { index: 1, role: "previous" },
      { index: 2, role: "current" },
      { index: 3, role: "next" },
    ]);
  });

  it("wraps round at both ends", () => {
    expect(visibleSlots(0, 5).map((s) => s.index)).toEqual([4, 0, 1]);
    expect(visibleSlots(4, 5).map((s) => s.index)).toEqual([3, 4, 0]);
  });
});

describe("galleryReducer", () => {
  const start = initialGallery(4);

  it("starts on the first photo, moving by itself, with the zoom view closed", () => {
    expect(start).toMatchObject({ index: 0, auto: true, zoom: false, magnified: false });
    expect(AUTOPLAY_MS).toBe(3000);
  });

  it("moves on by itself and wraps, and keeps moving by itself", () => {
    let s = start;
    for (let i = 0; i < 4; i++) s = galleryReducer(s, { type: "tick" });
    expect(s.index).toBe(0);
    expect(s.auto).toBe(true);
  });

  it("stops moving by itself once the shopper takes over", () => {
    expect(galleryReducer(start, { type: "next" })).toMatchObject({ index: 1, auto: false });
    expect(galleryReducer(start, { type: "prev" })).toMatchObject({ index: 3, auto: false });
    expect(galleryReducer(start, { type: "select", index: 2 })).toMatchObject({ index: 2, auto: false });
  });

  it("ignores a tick when it has been stopped, and a choice outside the photos", () => {
    const stopped = galleryReducer(start, { type: "next" });
    expect(galleryReducer(stopped, { type: "tick" })).toBe(stopped);
    expect(galleryReducer(start, { type: "select", index: 9 })).toBe(start);
    expect(galleryReducer(start, { type: "select", index: -1 })).toBe(start);
  });

  it("opens the zoom view on the current photo and stops the movement", () => {
    expect(galleryReducer(start, { type: "openZoom" })).toMatchObject({ zoom: true, auto: false, magnified: false });
  });

  it("closes the zoom view and resets the magnifying", () => {
    const open = galleryReducer(galleryReducer(start, { type: "openZoom" }), { type: "toggleMagnify" });
    expect(open.magnified).toBe(true);
    expect(galleryReducer(open, { type: "closeZoom" })).toMatchObject({ zoom: false, magnified: false });
  });

  it("toggles magnifying only while the zoom view is open", () => {
    expect(galleryReducer(start, { type: "toggleMagnify" })).toBe(start);
    const open = galleryReducer(start, { type: "openZoom" });
    expect(galleryReducer(galleryReducer(open, { type: "toggleMagnify" }), { type: "toggleMagnify" }).magnified).toBe(false);
  });

  it("changes photo inside the zoom view and starts that photo unmagnified", () => {
    const open = galleryReducer(galleryReducer(start, { type: "openZoom" }), { type: "toggleMagnify" });
    expect(galleryReducer(open, { type: "next" })).toMatchObject({ index: 1, magnified: false, zoom: true });
  });

  it("does nothing with one photo or none", () => {
    expect(galleryReducer(initialGallery(1), { type: "next" }).index).toBe(0);
    expect(galleryReducer(initialGallery(1), { type: "tick" }).index).toBe(0);
    expect(galleryReducer(initialGallery(0), { type: "next" }).index).toBe(0);
  });
});

describe("keyAction", () => {
  it("closes the zoom view on Escape, and only when it is open", () => {
    expect(keyAction("Escape", true)).toBe("closeZoom");
    expect(keyAction("Escape", false)).toBeNull();
  });

  it("moves with the arrow keys", () => {
    expect(keyAction("ArrowRight", false)).toBe("next");
    expect(keyAction("ArrowLeft", true)).toBe("prev");
  });

  it("leaves every other key alone", () => {
    expect(keyAction("a", true)).toBeNull();
    expect(keyAction("Tab", false)).toBeNull();
  });
});
