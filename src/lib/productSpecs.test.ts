import { describe, expect, it } from "vitest";
import { parseDescription } from "@/lib/productSpecs";

// The shape Wix hands the storefront for the Casio and Poedagar descriptions.
const casio =
  "<p>An analogue quartz men's watch with a black dial and a day and date display.</p>" +
  '<p><span style="font-weight: 700">Key features</span></p>' +
  "<ul><li><p>50-meter water resistance</p></li><li><p>Genuine leather band</p></li></ul>" +
  '<p><span style="font-weight: 700">Specifications</span></p>' +
  "<ul><li><p>Case size (L x W x H): 46.6 x 39.9 x 8.9 mm</p></li>" +
  "<li><p>Weight: 52 g</p></li>" +
  "<li><p>Battery: about 3 years (SR920SW)</p></li></ul>";

describe("parseDescription", () => {
  it("splits a Casio description into the intro, the key features and the spec rows", () => {
    const parsed = parseDescription(casio);
    expect(parsed?.introHtml).toBe("<p>An analogue quartz men's watch with a black dial and a day and date display.</p>");
    expect(parsed?.features).toEqual(["50-meter water resistance", "Genuine leather band"]);
    expect(parsed?.specs).toEqual([
      { label: "Case size (L x W x H)", value: "46.6 x 39.9 x 8.9 mm" },
      { label: "Weight", value: "52 g" },
      { label: "Battery", value: "about 3 years (SR920SW)" },
    ]);
  });

  it("cuts each line at the first colon only, so a value may hold its own colon", () => {
    const html = "<p><b>Specifications</b></p><ul><li>Movement: quartz: analogue</li></ul>";
    expect(parseDescription(html)?.specs).toEqual([{ label: "Movement", value: "quartz: analogue" }]);
  });

  it("finds the heading however Wix or a person wrapped it", () => {
    for (const heading of [
      "<p><strong>Specifications</strong></p>",
      "<h3>Specifications</h3>",
      "<p>SPECIFICATIONS</p>",
      '<p><span style="font-weight: 700">Specifications:</span></p>',
    ]) {
      const parsed = parseDescription(heading + "<ul><li>Weight: 22 g</li></ul>");
      expect(parsed?.specs, heading).toEqual([{ label: "Weight", value: "22 g" }]);
    }
  });

  it("gives no features when the description has none", () => {
    const parsed = parseDescription("<p>Intro.</p><p><b>Specifications</b></p><ul><li>Weight: 22 g</li></ul>");
    expect(parsed?.features).toEqual([]);
    expect(parsed?.introHtml).toBe("<p>Intro.</p>");
  });

  it("returns null for a description with no spec list, so the page shows it as it always did", () => {
    expect(parseDescription("<p>A lovely watch.</p>")).toBeNull();
    expect(parseDescription("")).toBeNull();
    expect(parseDescription("<p><b>Key features</b></p><ul><li>Water resistant</li></ul>")).toBeNull();
  });

  it("returns null when any spec line has no label and value, so no text is lost", () => {
    const html = "<p><b>Specifications</b></p><ul><li>Weight: 22 g</li><li>Comes in a gift box</li></ul>";
    expect(parseDescription(html)).toBeNull();
  });

  it("returns null when a spec heading has no list under it", () => {
    expect(parseDescription("<p><b>Specifications</b></p><p>Weight: 22 g</p>")).toBeNull();
  });

  it("turns markup and entities in a line into plain text", () => {
    const html = "<p><b>Specifications</b></p><ul><li><p>Case &amp; bezel: <strong>ion plated</strong> &quot;black&quot;</p></li></ul>";
    expect(parseDescription(html)?.specs).toEqual([{ label: "Case & bezel", value: 'ion plated "black"' }]);
  });

  it("decodes numeric references in decimal and in hex", () => {
    const html = "<p><b>Specifications</b></p><ul><li>Band&#x27;s lug: 20&#38;21 mm&#xA0;wide</li></ul>";
    expect(parseDescription(html)?.specs).toEqual([{ label: "Band's lug", value: "20&21 mm wide" }]);
  });

  it("keeps whatever follows the spec list", () => {
    const html = "<p><b>Specifications</b></p><ul><li>Weight: 22 g</li></ul><p>Delivery across Kenya.</p>";
    expect(parseDescription(html)?.trailingHtml).toBe("<p>Delivery across Kenya.</p>");
    expect(parseDescription(casio)?.trailingHtml).toBe("");
  });
});
