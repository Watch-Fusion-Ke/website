"use client";

import { useEffect, useState, type RefObject } from "react";
import { SCROLL_DELTA, nextHeaderState, type HeaderState } from "@/lib/headerScroll";

// Follows the page's scroll for the sticky header. Reads happen at most once a frame, and nothing is redrawn unless the look changes.
export const useHeaderScroll = (header: RefObject<HTMLElement>): HeaderState => {
  const [state, setState] = useState<HeaderState>({ elevated: false, searchHidden: false });

  useEffect(() => {
    let anchor = window.scrollY;
    let waiting = false;

    const update = () => {
      waiting = false;
      const y = window.scrollY;
      const active = document.activeElement;
      const typing = Boolean(header.current && active && header.current.contains(active) && active.tagName === "INPUT");
      const from = anchor; // the updater runs later, so it must not read `anchor` after it has moved on
      setState((prev) => nextHeaderState(prev, y, from, typing));
      if (Math.abs(y - anchor) >= SCROLL_DELTA || y <= 0) anchor = y;
    };
    const onScroll = () => {
      if (waiting) return;
      waiting = true;
      requestAnimationFrame(update);
    };
    // Reaching into the header with the keyboard brings the search row back, so a focused control is never out of sight.
    const onFocusIn = (event: FocusEvent) => {
      if (header.current && event.target instanceof Node && header.current.contains(event.target)) {
        setState((prev) => (prev.searchHidden ? { ...prev, searchHidden: false } : prev));
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [header]);

  return state;
};
