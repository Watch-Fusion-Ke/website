import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProductDescription from "@/components/ProductDescription";

const withSpecs =
  "<p>An analogue quartz men's watch.</p>" +
  "<p><b>Key features</b></p><ul><li>Genuine leather band</li></ul>" +
  "<p><b>Specifications</b></p><ul><li>Weight: 52 g</li><li>Glass: mineral glass</li></ul>" +
  "<p>Delivery across Kenya.</p>";

const render = (html: string) => renderToStaticMarkup(<ProductDescription html={html} />);

describe("ProductDescription", () => {
  it("shows a description that has a spec list as the intro, the features, the spec table and what follows", () => {
    const html = render(withSpecs);
    expect(html).toContain("An analogue quartz men's watch.");
    expect(html).toContain("Genuine leather band");
    expect(html.match(/<dt\b/g)).toHaveLength(2);
    expect(html.indexOf("An analogue")).toBeLessThan(html.indexOf("Genuine leather band"));
    expect(html.indexOf("Genuine leather band")).toBeLessThan(html.indexOf("<dl"));
    expect(html.indexOf("<dl")).toBeLessThan(html.indexOf("Delivery across Kenya."));
  });

  it("does not print the spec lines twice", () => {
    const html = render(withSpecs);
    expect(html.match(/Weight/g)).toHaveLength(1);
    expect(html.match(/Specifications/g)).toHaveLength(1);
  });

  it("shows a description with no spec list exactly as the page always did", () => {
    expect(render("<p>A lovely watch.</p>")).toBe('<div class="text-gray-600 leading-relaxed"><p>A lovely watch.</p></div>');
  });

  it("strips scripts and event handlers from every part, table or not", () => {
    const bad = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
    for (const html of [render(bad + "<p>Plain.</p>"), render(bad + withSpecs + bad)]) {
      expect(html).not.toContain("<script");
      expect(html).not.toContain("onerror");
    }
  });
});
