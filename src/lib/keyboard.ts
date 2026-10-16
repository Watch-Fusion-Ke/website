// True when a key press happened while the shopper was typing or using a control,
// so page-wide keyboard shortcuts must leave it alone.
export const isTypingOrControl = (target: EventTarget | null): boolean => {
  const el = target as { tagName?: string; isContentEditable?: boolean } | null;
  if (!el || typeof el.tagName !== "string") return false;
  if (el.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(el.tagName.toUpperCase());
};
