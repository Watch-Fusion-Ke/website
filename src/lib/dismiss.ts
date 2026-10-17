// Calls onDismiss when Escape is pressed anywhere, or when the shopper presses outside the box.
// `target` is the document (or any event target). Returns a function that stops listening.
export const attachDismiss = (
  target: Pick<EventTarget, "addEventListener" | "removeEventListener">,
  isInside: (node: unknown) => boolean,
  onDismiss: () => void
): (() => void) => {
  const onKey = (e: Event) => {
    if ((e as KeyboardEvent).key === "Escape") onDismiss();
  };
  const onPress = (e: Event) => {
    if (!isInside(e.target)) onDismiss();
  };
  target.addEventListener("keydown", onKey);
  target.addEventListener("pointerdown", onPress);
  return () => {
    target.removeEventListener("keydown", onKey);
    target.removeEventListener("pointerdown", onPress);
  };
};
