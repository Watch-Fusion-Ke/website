// What the product gallery shows, photos and videos alike, kept apart from the screen so it can be tested.

export type GalleryItem = { id: string; kind: "photo" | "video"; url: string; videoUrl: string | null };

type VideoFile = { url?: string | null; width?: number | null; height?: number | null; format?: string | null };

// The shape the store sends for each piece of media: a photo has an image, a video has a list of files and a still picture.
export type MediaInput = {
  _id?: string | null;
  image?: { url?: string | null } | null;
  video?: { files?: VideoFile[] | null } | null;
  thumbnail?: { url?: string | null } | null;
};

// A video is sent as the 720p copy: sharp enough on a phone, and a fraction of the size of the 1080p one.
const TARGET_SHORT_SIDE = 720;

const shortSide = (file: VideoFile) => Math.min(file.width ?? 0, file.height ?? 0);

/** The file to play: the one closest to 720p, never a streaming playlist (marked "hls" by the store), which a plain video tag cannot play. */
export function pickVideoFile(files: VideoFile[] | null | undefined): string | null {
  const playable = (files ?? []).filter((file): file is VideoFile & { url: string } => Boolean(file?.url) && file.format?.toLowerCase() !== "hls" && !/\.m3u8($|\?)/i.test(file.url ?? ""));
  if (playable.length === 0) return null;
  const distance = (file: VideoFile) => (shortSide(file) > 0 ? Math.abs(shortSide(file) - TARGET_SHORT_SIDE) : Infinity);
  const [best] = [...playable].sort((a, b) => distance(a) - distance(b) || shortSide(a) - shortSide(b));
  return best.url;
}

// The store gives a video's still picture as a 50 pixel thumbnail, which would look blurred as the video's poster.
// The same picture can be asked for at any size by changing the size in its address.
const STILL_SIZE = 1000;

/** The still picture's address, asking for a size that stays sharp on the page. An address with no size in it is left as it is. */
export const largerStill = (url: string) => url.replace(/(\/v1\/(?:fit|fill)\/)w_\d+,h_\d+/, `$1w_${STILL_SIZE},h_${STILL_SIZE}`);

/** The gallery's photos and videos in the shop's order. A video with no file to play, or no still picture to show, is left out. */
export function toGalleryMedia(items: (MediaInput | null | undefined)[] | null | undefined): GalleryItem[] {
  return (items ?? []).flatMap((item, i): GalleryItem[] => {
    if (!item) return [];
    const id = item._id ?? `media-${i}`;
    if (item.video) {
      const videoUrl = pickVideoFile(item.video.files);
      const still = item.thumbnail?.url;
      return videoUrl && still ? [{ id, kind: "video", url: largerStill(still), videoUrl }] : [];
    }
    return item.image?.url ? [{ id, kind: "photo", url: item.image.url, videoUrl: null }] : [];
  });
}

type Advance = { auto: boolean; zoom: boolean; count: number; reducedMotion: boolean; onVideo: boolean };

/** Whether the gallery moves on to the next item by itself. It stays on a video so the video is not cut off. */
export const canAutoAdvance = ({ auto, zoom, count, reducedMotion, onVideo }: Advance) => auto && !zoom && count >= 2 && !reducedMotion && !onVideo;

/** Whether a video starts playing by itself (silently). Not for a shopper who asked for less motion or less data. */
export const shouldAutoplayVideo = ({ reducedMotion, saveData }: { reducedMotion: boolean; saveData: boolean }) => !reducedMotion && !saveData;

/** Whether a key press belongs to a focused video. The arrow keys seek in a video, so the gallery must not also act on them. */
export const videoKeepsKey = (action: string | null, target: { tagName?: string } | null) =>
  (action === "next" || action === "prev") && target?.tagName === "VIDEO";
