import { describe, expect, it } from "vitest";
import { isTypingOrControl } from "@/lib/keyboard";

describe("isTypingOrControl", () => {
  it("is true for text fields, so a space typed in the search box is not swallowed", () => {
    expect(isTypingOrControl({ tagName: "INPUT" } as unknown as EventTarget)).toBe(true);
    expect(isTypingOrControl({ tagName: "textarea" } as unknown as EventTarget)).toBe(true);
    expect(isTypingOrControl({ tagName: "DIV", isContentEditable: true } as unknown as EventTarget)).toBe(true);
  });

  it("is true for buttons, links and dropdowns, which use the space key themselves", () => {
    for (const tagName of ["BUTTON", "A", "SELECT"]) {
      expect(isTypingOrControl({ tagName } as unknown as EventTarget)).toBe(true);
    }
  });

  it("is false for the page itself and plain elements", () => {
    expect(isTypingOrControl({ tagName: "BODY" } as unknown as EventTarget)).toBe(false);
    expect(isTypingOrControl({ tagName: "DIV" } as unknown as EventTarget)).toBe(false);
    expect(isTypingOrControl(null)).toBe(false);
  });
});
