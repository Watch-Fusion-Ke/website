import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProductImages, { ZoomView } from "@/components/ProductImages";

const photos = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ _id: `p${i}`, image: { url: `https://img/${i}.jpg` } }));

const render = (n: number) => renderToStaticMarkup(<ProductImages items={photos(n)} />);

describe("ProductImages", () => {
  it("keeps the main photo short on a phone so the name and price show without scrolling", () => {
    const html = render(5);
    const frame = html.match(/<button[^>]*data-main-photo[^>]*>/)?.[0] ?? "";
    expect(frame).toContain("h-[min(");
    expect(frame).toContain("lg:h-[500px]");
    expect(frame).not.toContain(" h-[500px]");
  });

  it("opens the zoom view only when the main photo is tapped, so it is a button and the view starts closed", () => {
    const html = render(5);
    expect(html).toMatch(/<button[^>]*data-main-photo[^>]*aria-haspopup="dialog"/);
    expect(html).toContain('aria-label="Zoom in on the photo"');
    expect(html).not.toContain('role="dialog"');
  });

  it("shows three small photos, the current one in the middle, instead of one tile per photo", () => {
    const html = render(8);
    expect(html.match(/data-slot="/g)).toHaveLength(3);
    const order = Array.from(html.matchAll(/data-slot="(previous|current|next)"/g)).map((m) => m[1]);
    expect(order).toEqual(["previous", "current", "next"]);
    expect(html.match(/aria-current="true"/g)).toHaveLength(1);
  });

  it("has previous and next buttons that a screen reader can name", () => {
    const html = render(5);
    expect(html).toContain('aria-label="Previous photo"');
    expect(html).toContain('aria-label="Next photo"');
  });

  it("gives every button a tap area of at least 40px", () => {
    const html = render(5);
    const arrows = html.match(/<button[^>]*aria-label="(Previous|Next) photo"[^>]*>/g) ?? [];
    expect(arrows).toHaveLength(2);
    for (const tag of arrows) expect(tag).toMatch(/h-(10|11|12)\b/);
  });

  it("has a button to pause and resume the photos moving by themselves", () => {
    const html = render(5);
    expect(html).toMatch(/<button[^>]*aria-pressed="false"[^>]*>[^<]*Pause/);
    expect(render(1)).not.toContain("Pause");
  });

  it("shows no strip or arrows for a single photo", () => {
    const html = render(1);
    expect(html).not.toContain("data-slot");
    expect(html).not.toContain("Next photo");
    expect(html).toContain("data-main-photo");
  });

  it("shows nothing for a product with no photos, and skips media with no picture", () => {
    expect(renderToStaticMarkup(<ProductImages items={undefined} />)).toBe("");
    expect(renderToStaticMarkup(<ProductImages items={[]} />)).toBe("");
    const mixed = renderToStaticMarkup(<ProductImages items={[{ _id: "v" }, ...photos(1)]} />);
    expect(mixed).toContain("https%3A%2F%2Fimg%2F0.jpg");
    expect(mixed).not.toContain("Next photo");
  });

  it("uses the shop's gold, never pink, and works in the dark theme", () => {
    const html = render(5);
    expect(html).toContain("ring-brand-gold");
    expect(html).not.toMatch(/pink|rose|fuchsia/);
  });
});

describe("ZoomView", () => {
  const view = (magnified = false, count = 3) =>
    renderToStaticMarkup(
      <ZoomView
        url="https://img/1.jpg"
        count={count}
        magnified={magnified}
        onClose={() => {}}
        onNext={() => {}}
        onPrev={() => {}}
        onToggle={() => {}}
      />
    );

  it("is a dialog that covers the page and can be closed with a button", () => {
    const html = view();
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="Close zoomed photo"');
  });

  it("shows the photo fitted to the screen first and larger once tapped", () => {
    expect(view(false)).toContain('data-magnified="false"');
    expect(view(true)).toContain('data-magnified="true"');
  });

  it("keeps the arrows light on the dark background, with no grey hover, and 44px to tap", () => {
    const arrows = view().match(/<button[^>]*aria-label="(Previous|Next) photo"[^>]*>/g) ?? [];
    expect(arrows).toHaveLength(2);
    for (const tag of arrows) {
      expect(tag).not.toContain("gray-");
      expect(tag).toContain("text-white");
      expect(tag).toContain("h-11");
    }
  });

  it("asks for a larger picture while magnified so it stays sharp", () => {
    expect(view(false)).not.toContain("250vw");
    expect(view(true)).toContain("250vw");
  });

  it("tells the shopper they can tap or pinch, and has arrows only when there is more than one photo", () => {
    expect(view()).toContain("Tap the photo to zoom");
    expect(view(false, 3)).toContain('aria-label="Next photo"');
    expect(view(false, 1)).not.toContain('aria-label="Next photo"');
  });
});
