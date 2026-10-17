import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ThemeToggle from "@/components/ThemeToggle";

describe("ThemeToggle", () => {
  it("is a real button named for what it does, with its on or off state exposed", () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    expect(html).toMatch(/<button[^>]*type="button"/);
    expect(html).toContain('aria-label="Dark mode"');
    expect(html).toContain('aria-pressed="false"');
  });

  it("shows a moon in the light theme and a sun in the dark theme, using only CSS so the right one shows before the page loads", () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    expect(html).toMatch(/<svg[^>]*class="[^"]*\bdark:hidden\b/);
    expect(html).toMatch(/<svg[^>]*class="[^"]*\bhidden dark:block\b/);
  });

  it("names itself by the words it shows when it has a written label, so voice control can say them", () => {
    const tag = renderToStaticMarkup(<ThemeToggle showLabel />).match(/<button[^>]*>/)?.[0] ?? "";
    expect(tag).not.toContain("aria-label");
    expect(tag).not.toContain("aria-pressed");
  });

  it("lines its label up to the left when it fills a row, without a competing centre rule", () => {
    const classes = renderToStaticMarkup(<ThemeToggle showLabel />).match(/<button[^>]*class="([^"]*)"/)?.[1].split(" ") ?? [];
    expect(classes).toContain("justify-start");
    expect(classes).not.toContain("justify-center");
  });

  it("is a tap target of at least 44 px", () => {
    const classes = renderToStaticMarkup(<ThemeToggle />).match(/<button[^>]*class="([^"]*)"/)?.[1].split(" ") ?? [];
    expect(classes).toContain("w-11");
    expect(classes).toContain("h-11");
  });

  it("can show a written label that always names the other theme", () => {
    const html = renderToStaticMarkup(<ThemeToggle showLabel />);
    expect(html).toMatch(/<span[^>]*dark:hidden[^>]*>Dark mode<\/span>/);
    expect(html).toMatch(/<span[^>]*hidden dark:inline[^>]*>Light mode<\/span>/);
  });
});
