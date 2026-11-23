import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProductImages, { ZoomView } from "@/components/ProductImages";

const photos = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ _id: `p${i}`, image: { url: `https://img/${i}.jpg` } }));

const render = (n: number) => renderToStaticMarkup(<ProductImages items={photos(n)} />);

describe("ProductImages photo text", () => {
  it("gives the main photo the product's name as its text, so the picture can be found in image search", () => {
    const html = renderToStaticMarkup(<ProductImages items={photos(3)} name="Casio MTP-V006L-1B" />);
    expect(html.match(/<img[^>]*alt="Casio MTP-V006L-1B"[^>]*>/)).not.toBeNull();
  });

  it("leaves the text empty when no name is given, and on the small thumbnails, which only repeat the main photo", () => {
    const withName = renderToStaticMarkup(<ProductImages items={photos(3)} name="Casio MTP" />);
    expect((withName.match(/alt="Casio MTP"/g) ?? []).length).toBe(1);
    expect(renderToStaticMarkup(<ProductImages items={photos(3)} />)).not.toContain('alt="Casio');
  });
});

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

const clip = { _id: "clip", video: { files: [{ url: "https://v/clip.mp4", width: 576, height: 1024 }] }, thumbnail: { url: "https://still/clip.jpg" } };

describe("ProductImages with a video", () => {
  it("plays a video in the main spot silently, inline on a phone, and without downloading it until it is needed", () => {
    const html = renderToStaticMarkup(<ProductImages items={[clip, ...photos(2)]} />);
    const tag = html.match(/<video[^>]*>/)?.[0] ?? "";
    expect(tag).toContain('src="https://v/clip.mp4"');
    expect(tag).toContain('poster="https://still/clip.jpg"');
    expect(tag).toContain("muted");
    expect(tag).toContain("playsinline");
    expect(tag).toContain('preload="none"');
    expect(tag).toContain("loop");
    expect(tag).toContain("controls");
  });

  it("describes the video to a screen reader with the product's name", () => {
    const html = renderToStaticMarkup(<ProductImages items={[clip, ...photos(2)]} name="Casio MTP-V006L-1B" />);
    expect(html).toContain('aria-label="Casio MTP-V006L-1B video"');
    expect(renderToStaticMarkup(<ProductImages items={[clip, ...photos(2)]} />)).toContain('aria-label="Product video"');
  });

  it("has no zoom button on a video, which has nothing to zoom, but keeps it on a photo", () => {
    const first = renderToStaticMarkup(<ProductImages items={[clip, ...photos(2)]} />);
    expect(first).not.toContain("data-main-photo");
    expect(first).toContain("data-main-video");
    const second = renderToStaticMarkup(<ProductImages items={[photos(1)[0], clip, ...photos(1)]} />);
    expect(second).toContain("data-main-photo");
    expect(second).not.toContain("<video");
  });

  it("marks a video in the small strip with a play mark and says it is a video", () => {
    const html = renderToStaticMarkup(<ProductImages items={[photos(1)[0], clip, photos(2)[1]]} />);
    expect(html).toContain('aria-label="Show video 2 of 3"');
    expect(html.match(/data-play-mark/g)).toHaveLength(1);
    expect(html).toContain("https://still/clip.jpg");
  });

  it("shows a video's still as it is, not through the image resizer, so an unfamiliar picture host cannot break the page", () => {
    const html = renderToStaticMarkup(<ProductImages items={[photos(1)[0], clip, photos(2)[1]]} />);
    const tile = html.match(/<img[^>]*clip\.jpg[^>]*>/)?.[0] ?? "";
    expect(tile).not.toBe("");
    expect(tile).not.toContain("_next/image");
    const shot = html.match(/<img[^>]*img%2F0\.jpg[^>]*>/)?.[0] ?? "";
    expect(shot).toContain("_next/image");
  });

  it("lets focus come back to the video after the full screen view closes", () => {
    const html = renderToStaticMarkup(<ProductImages items={[clip, ...photos(2)]} />);
    expect(html.match(/<div[^>]*data-main-video[^>]*>/)?.[0]).toContain('tabindex="-1"');
  });

  it("offers Pause photos only while a photo is showing, since a video does not move on", () => {
    expect(renderToStaticMarkup(<ProductImages items={[clip, ...photos(2)]} />)).not.toMatch(/Pause photos|Play photos/);
    expect(renderToStaticMarkup(<ProductImages items={[photos(1)[0], clip, photos(2)[1]]} />)).toContain("Pause photos");
  });

  it("still names the other tiles photos", () => {
    const html = renderToStaticMarkup(<ProductImages items={[photos(1)[0], clip, photos(2)[1]]} />);
    expect(html).toContain('aria-label="Show photo 3 of 3"');
  });

  it("does not swipe a video away, since the swipe would fight the video's own controls", () => {
    const html = renderToStaticMarkup(<ProductImages items={[clip, ...photos(2)]} />);
    const stage = html.match(/<div[^>]*data-main-video[^>]*>/)?.[0] ?? "";
    expect(stage).not.toContain("ontouch");
  });

  it("leaves a photo-only product exactly as it was", () => {
    const html = render(3);
    expect(html).not.toContain("<video");
    expect(html).not.toContain("data-play-mark");
    expect(html).toContain("data-main-photo");
  });
});

describe("ZoomView with a video", () => {
  const view = (props = {}) =>
    renderToStaticMarkup(
      <ZoomView url="https://still/clip.jpg" videoUrl="https://v/clip.mp4" count={3} magnified={false} onClose={() => {}} onNext={() => {}} onPrev={() => {}} onToggle={() => {}} {...props} />
    );

  it("plays the video full screen with its own controls", () => {
    const html = view();
    const tag = html.match(/<video[^>]*>/)?.[0] ?? "";
    expect(tag).toContain('src="https://v/clip.mp4"');
    expect(tag).toContain("controls");
    expect(tag).toContain("muted");
    expect(tag).toContain("playsinline");
  });

  it("names the view a video, and drops the zoom instructions and the zoom button, which belong to photos", () => {
    const html = view();
    expect(html).toContain('aria-label="Product video"');
    expect(html).not.toContain("Tap the photo to zoom");
    expect(html).not.toContain("data-magnified");
  });

  it("keeps the close button and the arrows", () => {
    const html = view();
    expect(html).toContain("data-close");
    expect(html).toContain('aria-label="Next photo"');
  });
});

