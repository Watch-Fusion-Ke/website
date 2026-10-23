// static: what the server sends and what a visitor without scripts sees. armed: waiting below the fold. shown: playing in.
export type Phase = "static" | "armed" | "shown";

type Situation = { hasObserver: boolean; reducedMotion: boolean; top: number; viewportHeight: number };

/** Whether the table should wait to be scrolled to (armed) or stay exactly as the server drew it (static). */
export function startingPhase({ hasObserver, reducedMotion, top, viewportHeight }: Situation): Exclude<Phase, "shown"> {
  if (!hasObserver || reducedMotion) return "static";
  // Already on screen, or scrolled past, when the page opens: leave it rather than hide it and play it in.
  return top < viewportHeight ? "static" : "armed";
}

export const rowDelayMs = (index: number) => Math.min(index, 12) * 45 + 250;
