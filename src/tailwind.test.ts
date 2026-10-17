import { describe, expect, it } from "vitest";
import config from "../tailwind.config";

describe("tailwind theme", () => {
  const fonts = (config.theme?.extend as { fontFamily?: Record<string, string[]> })?.fontFamily ?? {};

  it("sets the text font to Montserrat through its CSS variable", () => {
    expect(fonts.sans?.[0]).toBe("var(--font-montserrat)");
  });

  it("offers a display font for headings, with a serif fallback", () => {
    expect(fonts.display?.[0]).toBe("var(--font-display)");
    expect(fonts.display).toContain("serif");
  });
});
