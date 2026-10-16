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
    expect(render([slide(1), slide(2)])).not.toContain("100vh");
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
});
