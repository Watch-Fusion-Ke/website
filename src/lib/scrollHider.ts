type ScrollTarget = Pick<EventTarget, "addEventListener" | "removeEventListener">;

// Calls setHidden(true) at the first scroll and setHidden(false) once the page has stayed still for `delay` ms.
// Returns a function that stops listening. Used to move the floating chat icon out of the way while reading.
export const hideWhileScrolling = (
  target: ScrollTarget,
  setHidden: (hidden: boolean) => void,
  delay = 700
): (() => void) => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const onScroll = () => {
    setHidden(true);
    clearTimeout(timer);
    timer = setTimeout(() => setHidden(false), delay);
  };

  target.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    clearTimeout(timer);
    target.removeEventListener("scroll", onScroll);
  };
};
