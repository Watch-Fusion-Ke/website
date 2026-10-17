import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SliderClient, { type SlideData } from "@/components/SliderClient";

const slide = (n: number, extra: Partial<SlideData> = {}): SlideData => ({
  id: `s${n}`,
  title: `Headline ${n}`,
  description: `A long description of slide ${n}`,
  categoryTag: `Tag ${n}`,
  buttonText: `Button ${n}`,
  url: `/shop?slide=${n}`,
  img: `/products/photo${n}.jpg`,
  bg: "from-zinc-900 to-black",
  ...extra,
});

const render = (slides: SlideData[]) => renderToStaticMarkup(<SliderClient slides={slides} />);

describe("SliderClient", () => {
  it("shows each slide's headline, button text and link", () => {
    const html = render([slide(1), slide(2)]);
    for (const n of [1, 2]) {
      expect(html).toContain(`Headline ${n}`);
      expect(html).toContain(`Button ${n}`);
      expect(html).toContain(`href="/shop?slide=${n}"`);
    }
  });

  it("keeps the banner short: no description paragraph and no category tag on top of the photo", () => {
    const html = render([slide(1)]);
    expect(html).not.toContain("A long description of slide 1");
    expect(html).not.toContain("Tag 1");
  });

  it("never sizes the banner to the full height of the screen", () => {
    const html = render([slide(1), slide(2)]);
    expect(html).not.toContain("100vh");
    expect(html).not.toContain("h-screen");
  });

  it("takes slides that are off screen out of the tab order and away from screen readers", () => {
    const html = render([slide(1), slide(2)]);
    expect(html).toContain('aria-hidden="false"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('tabindex="-1"');
  });

  it("uses a single link as the button, not a button inside a link", () => {
    expect(render([slide(1)])).not.toContain("<button class=\"rounded-lg");
  });

  it("has one dot per slide, labelled for screen readers", () => {
    const html = render([slide(1), slide(2), slide(3)]);
    for (const n of [1, 2, 3]) expect(html).toContain(`aria-label="Go to slide ${n}"`);
    expect(html).not.toContain('aria-label="Go to slide 4"');
  });

  it("describes each photo with the slide's headline", () => {
    expect(render([slide(1)])).toContain('alt="Headline 1"');
  });

  it("renders nothing when there are no slides", () => {
    expect(render([])).toBe("");
  });

  it("lines the banner up with the product grid on large screens and runs edge to edge on phones", () => {
    const html = render([slide(1)]);
    const outer = html.match(/^<div class="([^"]*)"/)?.[1].split(" ") ?? [];
    for (const c of ["md:px-8", "lg:px-16", "xl:px-32", "2xl:px-64"]) expect(outer).toContain(c);
    expect(outer).not.toContain("px-4");
  });

  it("rounds the banner corners on large screens only", () => {
    expect(render([slide(1)])).toContain("md:rounded-lg");
  });

  it("does not add the page margins a second time inside the banner", () => {
    const html = render([slide(1)]);
    expect(html.match(/2xl:px-64/g)).toHaveLength(1);
  });

  it("keeps the headline clear of the arrows on large screens", () => {
    const html = render([slide(1)]);
    expect(html).toContain("md:pl-16");
    expect(html).toContain("md:pr-20");
  });
});
