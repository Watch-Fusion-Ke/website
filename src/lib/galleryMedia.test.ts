import { describe, expect, it } from "vitest";
import { canAutoAdvance, largerStill, pickVideoFile, shouldAutoplayVideo, toGalleryMedia, videoKeepsKey } from "@/lib/galleryMedia";

const file = (width: number | null, height: number | null, url = `https://v/${width}x${height}.mp4`) => ({ url, width, height });
const photo = (id: string, url: string) => ({ _id: id, image: { url } });
const video = (id: string, files: ReturnType<typeof file>[], still: string | null = "https://still/clip.jpg") => ({
  _id: id,
  video: { files },
  thumbnail: still ? { url: still } : null,
});

describe("pickVideoFile", () => {
  it("takes the file closest to 720p, so a phone is not sent the 1080p copy", () => {
    const files = [file(1920, 1080), file(1280, 720), file(854, 480), file(640, 360)];
    expect(pickVideoFile(files)).toBe("https://v/1280x720.mp4");
  });

  it("judges a portrait video by its short side too", () => {
    const files = [file(1080, 1920), file(720, 1280), file(540, 960)];
    expect(pickVideoFile(files)).toBe("https://v/720x1280.mp4");
  });

  it("takes the only file there is, whatever its size", () => {
    expect(pickVideoFile([file(1920, 1080)])).toBe("https://v/1920x1080.mp4");
    expect(pickVideoFile([file(576, 1024)])).toBe("https://v/576x1024.mp4");
  });

  it("takes the smaller file when two are as close to 720p as each other", () => {
    expect(pickVideoFile([file(1280, 960), file(640, 480)])).toBe("https://v/640x480.mp4");
  });

  it("leaves out streaming playlists, which a plain video tag cannot play", () => {
    const files = [file(1280, 720, "https://v/a/playlist.m3u8"), file(640, 360)];
    expect(pickVideoFile(files)).toBe("https://v/640x360.mp4");
  });

  it("uses a file that has no size, last of all", () => {
    expect(pickVideoFile([file(null, null, "https://v/unknown.mp4")])).toBe("https://v/unknown.mp4");
    expect(pickVideoFile([file(null, null, "https://v/unknown.mp4"), file(854, 480)])).toBe("https://v/854x480.mp4");
  });

  it("gives nothing when there is nothing to play", () => {
    expect(pickVideoFile([])).toBeNull();
    expect(pickVideoFile(undefined)).toBeNull();
    expect(pickVideoFile([file(1280, 720, "https://v/a.m3u8")])).toBeNull();
    expect(pickVideoFile([{ url: null, width: 640, height: 360 }])).toBeNull();
  });
});

describe("toGalleryMedia", () => {
  it("keeps photos and videos in the order the shop set them", () => {
    const media = toGalleryMedia([photo("a", "https://img/a.jpg"), video("b", [file(1280, 720)]), photo("c", "https://img/c.jpg")]);
    expect(media.map((m) => [m.id, m.kind])).toEqual([
      ["a", "photo"],
      ["b", "video"],
      ["c", "photo"],
    ]);
  });

  it("shows a video by its still picture and remembers which file to play", () => {
    const [clip] = toGalleryMedia([video("clip", [file(1920, 1080), file(1280, 720)], "https://still/clip.jpg")]);
    expect(clip).toEqual({ id: "clip", kind: "video", url: "https://still/clip.jpg", videoUrl: "https://v/1280x720.mp4" });
  });

  it("keeps a photo as it is, with no video file", () => {
    const [shot] = toGalleryMedia([photo("a", "https://img/a.jpg")]);
    expect(shot).toEqual({ id: "a", kind: "photo", url: "https://img/a.jpg", videoUrl: null });
  });

  it("skips a video with no file to play, or with no still picture to show in its place", () => {
    expect(toGalleryMedia([video("x", [])])).toEqual([]);
    expect(toGalleryMedia([video("y", [file(1280, 720)], null)])).toEqual([]);
  });

  it("skips media that is neither, and copes with no list at all", () => {
    expect(toGalleryMedia([{ _id: "z" }, null, undefined])).toEqual([]);
    expect(toGalleryMedia(undefined)).toEqual([]);
    expect(toGalleryMedia(null)).toEqual([]);
  });

  it("names an item by its position when it has no id", () => {
    const media = toGalleryMedia([{ image: { url: "https://img/a.jpg" } }, { video: { files: [file(640, 360)] }, thumbnail: { url: "https://s.jpg" } }]);
    expect(media.map((m) => m.id)).toEqual(["media-0", "media-1"]);
  });
});

describe("canAutoAdvance", () => {
  const base = { auto: true, zoom: false, count: 4, reducedMotion: false, onVideo: false };

  it("moves on by itself from one photo to the next", () => {
    expect(canAutoAdvance(base)).toBe(true);
  });

  it("stays put while a video is showing, so it is not cut off after three seconds", () => {
    expect(canAutoAdvance({ ...base, onVideo: true })).toBe(false);
  });

  it("stops when the shopper takes over, opens the zoom view, has one item, or asks for less motion", () => {
    expect(canAutoAdvance({ ...base, auto: false })).toBe(false);
    expect(canAutoAdvance({ ...base, zoom: true })).toBe(false);
    expect(canAutoAdvance({ ...base, count: 1 })).toBe(false);
    expect(canAutoAdvance({ ...base, reducedMotion: true })).toBe(false);
  });
});

describe("shouldAutoplayVideo", () => {
  it("plays a video by itself, silently", () => {
    expect(shouldAutoplayVideo({ reducedMotion: false, saveData: false })).toBe(true);
  });

  it("waits for a tap when the shopper asks for less motion or for less data", () => {
    expect(shouldAutoplayVideo({ reducedMotion: true, saveData: false })).toBe(false);
    expect(shouldAutoplayVideo({ reducedMotion: false, saveData: true })).toBe(false);
  });
});

describe("videoKeepsKey", () => {
  it("leaves the arrow keys to a focused video, which uses them to seek", () => {
    expect(videoKeepsKey("next", { tagName: "VIDEO" })).toBe(true);
    expect(videoKeepsKey("prev", { tagName: "VIDEO" })).toBe(true);
  });

  it("still lets Escape close the full screen view from a video", () => {
    expect(videoKeepsKey("closeZoom", { tagName: "VIDEO" })).toBe(false);
  });

  it("moves the gallery on from anywhere else", () => {
    expect(videoKeepsKey("next", { tagName: "BUTTON" })).toBe(false);
    expect(videoKeepsKey("prev", { tagName: "DIV" })).toBe(false);
    expect(videoKeepsKey("next", null)).toBe(false);
  });
});

describe("largerStill", () => {
  const small = "https://static.wixstatic.com/media/6e72d8_abc_f002.jpg/v1/fit/w_50,h_50,q_90/file.jpg";

  it("asks for the video's still at a size that stays sharp on the page, not the store's 50 pixel thumbnail", () => {
    expect(largerStill(small)).toBe("https://static.wixstatic.com/media/6e72d8_abc_f002.jpg/v1/fit/w_1000,h_1000,q_90/file.jpg");
  });

  it("changes only the size, so the picture and its quality stay as the store gave them", () => {
    const filled = "https://static.wixstatic.com/media/x_f002.jpg/v1/fill/w_50,h_50,al_c,q_85/file.jpg";
    expect(largerStill(filled)).toBe("https://static.wixstatic.com/media/x_f002.jpg/v1/fill/w_1000,h_1000,al_c,q_85/file.jpg");
  });

  it("leaves an address with no size in it as it is", () => {
    expect(largerStill("https://still/clip.jpg")).toBe("https://still/clip.jpg");
    expect(largerStill("https://static.wixstatic.com/media/x_f002.jpg")).toBe("https://static.wixstatic.com/media/x_f002.jpg");
  });

  it("is what a video is shown by in the gallery", () => {
    const [clip] = toGalleryMedia([{ _id: "v", video: { files: [{ url: "https://v/a.mp4", width: 576, height: 1024 }] }, thumbnail: { url: small } }]);
    expect(clip.url).toBe("https://static.wixstatic.com/media/6e72d8_abc_f002.jpg/v1/fit/w_1000,h_1000,q_90/file.jpg");
  });
});

describe("pickVideoFile and streaming files", () => {
  it("leaves out a file the store marks as streaming, whatever its address looks like", () => {
    const files = [
      { url: "https://files.wix.com/site/media/video/abc/def", width: 0, height: 0, format: "hls" },
      { url: "https://video.wixstatic.com/video/abc/480p/mp4/file.mp4", width: 576, height: 1024, format: "mp4" },
    ];
    expect(pickVideoFile(files)).toBe("https://video.wixstatic.com/video/abc/480p/mp4/file.mp4");
    expect(pickVideoFile([files[0]])).toBeNull();
  });

  it("picks the 480p file when it is the best the store made, as for a phone video 576 pixels wide", () => {
    const files = [
      { url: "https://video.wixstatic.com/video/abc/480p/mp4/file.mp4", width: 576, height: 1024, format: "mp4" },
      { url: "https://video.wixstatic.com/video/abc/360p/mp4/file.mp4", width: 202, height: 360, format: "mp4" },
    ];
    expect(pickVideoFile(files)).toBe("https://video.wixstatic.com/video/abc/480p/mp4/file.mp4");
  });
});

