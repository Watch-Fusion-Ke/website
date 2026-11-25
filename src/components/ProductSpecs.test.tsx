import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProductSpecs, { lineClass, rowClass } from "@/components/ProductSpecs";

const specs = [
  { label: "Case size (L x W x H)", value: "46.6 x 39.9 x 8.9 mm" },
  { label: "Weight", value: "52 g" },
  { label: "Battery", value: "about 3 years (SR920SW)" },
];
const features = ["50-meter water resistance", "Genuine leather band"];

const render = (props: Partial<Parameters<typeof ProductSpecs>[0]> = {}) =>
  renderToStaticMarkup(<ProductSpecs specs={specs} {...props} />);

describe("ProductSpecs", () => {
  it("lists every spec as a label with its value", () => {
    const html = render();
    expect(html.match(/<dt\b/g)).toHaveLength(3);
    expect(html.match(/<dd\b/g)).toHaveLength(3);
    expect(html).toContain("Case size (L x W x H)");
    expect(html).toContain("46.6 x 39.9 x 8.9 mm");
  });

  it("lets a long unbroken value, such as a link or a serial number, wrap inside its box instead of running off a phone's screen", () => {
    const html = render({ specs: [{ label: "Serial", value: "SR920SW-" + "0123456789".repeat(8) }] });
    const dd = html.match(/<dd class="([^"]*)"/)?.[1].split(" ") ?? [];
    expect(dd).toContain("min-w-0");
    expect(dd).toContain("break-words");
  });

  it("is a section named by its Specifications heading, so a screen reader announces it", () => {
    const html = render();
    const heading = html.match(/<h3[^>]*id="([^"]+)"[^>]*>Specifications<\/h3>/);
    expect(heading).not.toBeNull();
    expect(html).toContain(`aria-labelledby="${heading?.[1]}"`);
  });

  it("shows every row in the server markup, so a visitor without scripts and a search engine still read the specs", () => {
    const classes = (render({ features }).match(/class="([^"]*)"/g) ?? []).flatMap((attr) => attr.slice(7, -1).split(" "));
    for (const startState of ["opacity-0", "invisible", "hidden", "scale-x-0", "translate-y-2"]) {
      expect(classes).not.toContain(startState);
    }
  });

  it("switches its movement off for people who ask their device for less motion", () => {
    const html = render();
    const rows = html.match(/<div[^>]*data-spec-row[^>]*>/g) ?? [];
    expect(rows).toHaveLength(3);
    for (const row of rows) expect(row).toContain("motion-reduce:transition-none");
    expect(html).toMatch(/<span[^>]*data-spec-line[^>]*motion-reduce:transition-none/);
  });

  it("stacks the label over the value in a narrow box and sets them side by side in a wide one", () => {
    const html = render();
    expect(html).toContain("[container-type:inline-size]");
    expect(html).toMatch(/\[@container\(min-width:[\d.]+rem\)\]:grid-cols-\[/);
  });

  it("sets the heading in the shop's display font, with a short gold rule under it", () => {
    const html = render();
    expect(html).toMatch(/<h3[^>]*font-display[^>]*>Specifications<\/h3>/);
    expect(html).toMatch(/<span[^>]*data-spec-line[^>]*w-14/);
  });

  it("lists the key features above the table when it has some, and leaves the list out when it has none", () => {
    const withFeatures = render({ features });
    expect(withFeatures).toContain("50-meter water resistance");
    expect(withFeatures.indexOf("Genuine leather band")).toBeLessThan(withFeatures.indexOf("Specifications"));
    expect(withFeatures).toContain('aria-label="Key features"');
    expect(render()).not.toContain("Key features");
  });

  it("starts every value with a capital letter on screen, though the data writes some in lower case", () => {
    const values = render({ specs: [{ label: "Band", value: "genuine leather" }] }).match(/<dd[^>]*>/g) ?? [];
    expect(values).toHaveLength(1);
    expect(values[0]).toContain("first-letter:uppercase");
  });

  it("writes each value as text, so markup in a description cannot run", () => {
    const html = render({ specs: [{ label: "Note", value: "<img src=x onerror=alert(1)>" }] });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("takes its colours from the theme, so the dark theme flips them", () => {
    const html = render({ features });
    expect(html).not.toMatch(/\b(?:bg-white|text-black|bg-black|text-white)\b/);
    expect(html).toContain("text-gray-900");
  });

  it("shows the rows and the line when printed, even if the table was never scrolled to", () => {
    const html = render();
    expect(html).toContain("print:opacity-100");
    expect(html).toContain("print:translate-y-0");
    expect(html).toContain("print:scale-x-100");
  });

  it("has no hover highlight, since the rows are not links", () => {
    const rows = render().match(/<div[^>]*data-spec-row[^>]*>/g) ?? [];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row).not.toContain("hover:");
  });

  it("shows two rows with the same label, and two identical features, without a duplicate-key warning", () => {
    const errors: unknown[][] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => void errors.push(args);
    try {
      const html = render({
        specs: [
          { label: "Band", value: "leather" },
          { label: "Band", value: "stainless steel" },
        ],
        features: ["Water resistant", "Water resistant"],
      });
      expect(html.match(/<dt\b/g)).toHaveLength(2);
      expect(html.match(/Water resistant/g)).toHaveLength(2);
    } finally {
      console.error = original;
    }
    expect(errors).toEqual([]);
  });

  it("gives the gold a job: a line that draws under the heading", () => {
    expect(render()).toMatch(/<span[^>]*data-spec-line[^>]*bg-brand-gold/);
  });

  describe("while it plays in", () => {
    it("hides a row and its line only while waiting below the fold", () => {
      expect(rowClass("armed")).toContain("opacity-0");
      expect(lineClass("armed")).toContain("scale-x-0");
      for (const phase of ["static", "shown"] as const) {
        expect(rowClass(phase).split(" ")).not.toContain("opacity-0");
        expect(lineClass(phase).split(" ")).not.toContain("scale-x-0");
      }
    });

    it("moves only the opacity and the position, so a later colour change is never held back by the stagger delay", () => {
      expect(rowClass("shown")).toContain("transition-[opacity,transform]");
      expect(rowClass("shown").split(" ")).not.toContain("transition");
    });

    it("writes these classes in this file, which the stylesheet build reads, and not in a lib file, which it does not", () => {
      const config = readFileSync("tailwind.config.ts", "utf8");
      expect(config).toContain('"./src/components/**/*.{js,ts,jsx,tsx,mdx}"');
      expect(config).not.toContain("./src/lib/");
    });
  });
});
