// What the product photo gallery does, kept apart from the screen so it can be tested.

export const AUTOPLAY_MS = 3000;

export type GalleryState = { count: number; index: number; auto: boolean; zoom: boolean; magnified: boolean };
export type GalleryAction =
  | { type: "tick" }
  | { type: "next" }
  | { type: "prev" }
  | { type: "select"; index: number }
  | { type: "openZoom" }
  | { type: "closeZoom" }
  | { type: "toggleMagnify" }
  | { type: "toggleAuto" };

export const initialGallery = (count: number): GalleryState => ({ count, index: 0, auto: true, zoom: false, magnified: false });

const wrap = (n: number, count: number) => ((n % count) + count) % count;

export const galleryReducer = (state: GalleryState, action: GalleryAction): GalleryState => {
  const { count } = state;
  switch (action.type) {
    case "tick":
      return state.auto && count > 1 ? { ...state, index: wrap(state.index + 1, count) } : state;
    case "next":
      return count > 1 ? { ...state, index: wrap(state.index + 1, count), auto: false, magnified: false } : state;
    case "prev":
      return count > 1 ? { ...state, index: wrap(state.index - 1, count), auto: false, magnified: false } : state;
    case "select":
      return Number.isInteger(action.index) && action.index >= 0 && action.index < count
        ? { ...state, index: action.index, auto: false, magnified: false }
        : state;
    case "openZoom":
      return count > 0 ? { ...state, zoom: true, auto: false, magnified: false } : state;
    case "closeZoom":
      return { ...state, zoom: false, magnified: false };
    case "toggleAuto":
      return count > 1 ? { ...state, auto: !state.auto } : state;
    case "toggleMagnify":
      return state.zoom ? { ...state, magnified: !state.magnified } : state;
  }
};

export type Slot = { index: number; role: "previous" | "current" | "next" };

// The photos shown in the short strip: the current one in the middle with a neighbour on each side.
export const visibleSlots = (index: number, count: number): Slot[] => {
  if (count <= 0) return [];
  if (count === 1) return [{ index: 0, role: "current" }];
  if (count === 2) {
    return index === 0
      ? [{ index: 0, role: "current" }, { index: 1, role: "next" }]
      : [{ index: 0, role: "previous" }, { index: 1, role: "current" }];
  }
  return [
    { index: wrap(index - 1, count), role: "previous" },
    { index, role: "current" },
    { index: wrap(index + 1, count), role: "next" },
  ];
};

export const keyAction = (key: string, zoomOpen: boolean): "closeZoom" | "next" | "prev" | null => {
  if (key === "Escape") return zoomOpen ? "closeZoom" : null;
  if (key === "ArrowRight") return "next";
  if (key === "ArrowLeft") return "prev";
  return null;
};
