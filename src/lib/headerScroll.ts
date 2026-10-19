// How the top bar of the shop behaves while the page scrolls. It always stays at the top of the screen. At the very top
// the whole header shows. Once the page has moved it lifts off the page with a shadow, and on a phone the search row folds
// away while the shopper reads down, and comes back at the first scroll upwards, so the menu, logo and cart stay in reach.

export type HeaderState = { elevated: boolean; searchHidden: boolean };

export const ELEVATE_AT = 4; // pixels scrolled before the shadow shows
export const HIDE_AFTER = 120; // pixels from the top before the search row may fold away
export const SCROLL_DELTA = 8; // smaller movements are ignored, so the header does not flicker

// `lastY` is where the page was when the header last reacted. `keepOpen` is true while the shopper is typing in the search box.
export const nextHeaderState = (prev: HeaderState, y: number, lastY: number, keepOpen: boolean): HeaderState => {
  if (y <= 0) return prev.elevated || prev.searchHidden ? { elevated: false, searchHidden: false } : prev;

  const elevated = y > ELEVATE_AT;
  const dy = y - lastY;
  let searchHidden = prev.searchHidden;
  if (keepOpen) searchHidden = false;
  else if (dy >= SCROLL_DELTA && y > HIDE_AFTER) searchHidden = true;
  else if (dy <= -SCROLL_DELTA) searchHidden = false;

  return elevated === prev.elevated && searchHidden === prev.searchHidden ? prev : { elevated, searchHidden };
};
