import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import AnnouncementBar from "@/components/AnnouncementBar";

const html = renderToStaticMarkup(<AnnouncementBar />);
const source = readFileSync("src/components/AnnouncementBar.tsx", "utf8");

describe("AnnouncementBar", () => {
  it("is a labelled region carrying the messages", () => {
    expect(html).toMatch(/<div[^>]*role="region"[^>]*aria-label="Shop announcements"/);
    expect(html).toContain("We offer custom engraving");
    expect(html).toContain("Same day deliveries");
  });

  it("opens WhatsApp in a new tab from the engraving message, and the other messages are not links", () => {
    const links = html.match(/<a [^>]*>/g) ?? [];
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toContain('href="https://wa.me/');
      expect(link).toContain('target="_blank"');
      expect(link).toContain('rel="noopener noreferrer"');
    }
  });

  it("lets a screen reader hear the messages once: only the first run is exposed, every repeat is hidden from it", () => {
    const visible = (html.match(/We offer custom engraving/g) ?? []).length;
    const hiddenRuns = (html.match(/aria-hidden="true"/g) ?? []).length;
    expect(visible).toBeGreaterThan(1); // repeated so the strip never runs out
    expect(hiddenRuns).toBeGreaterThan(0);
    // the one readable copy is not inside an aria-hidden run
    const firstRun = html.slice(html.indexOf("We offer custom engraving") - 400, html.indexOf("We offer custom engraving"));
    expect(firstRun).not.toContain('aria-hidden="true"><');
  });

  it("slides across, stops while a pointer or the keyboard is on it, and stays still for people who ask for less motion", () => {
    expect(html).toContain("marquee-track");
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toMatch(/\.marquee:hover \.marquee-track/);
    expect(css).toMatch(/\.marquee:focus-within \.marquee-track/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*\.marquee-track\s*\{[^}]*animation:\s*none/);
  });

  it("keeps its speed steady however many messages there are, by setting the time from the number of messages", () => {
    expect(html).toMatch(/animation-duration:\s*\d+s/);
  });

  it("uses colour values that the dark theme's own brand rules do not rewrite, and the site font", () => {
    expect(source).not.toMatch(/bg-brand-navy|text-brand-navy|bg-brand-gold/);
    expect(source).not.toMatch(/fontFamily|Futura/);
    expect(source).toMatch(/#1E2235/i);
    expect(source).toMatch(/#FFC516/i);
  });

  it("is not a main heading and names no person", () => {
    expect(html).not.toMatch(/<h1[\s>]/);
    expect(html.toLowerCase()).not.toContain("mercy");
  });
});

describe("the page layout", () => {
  it("puts the bar above the header", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    expect(layout).toContain("<AnnouncementBar />");
    expect(layout.indexOf("<AnnouncementBar />")).toBeLessThan(layout.indexOf("<Navbar />"));
  });
});
