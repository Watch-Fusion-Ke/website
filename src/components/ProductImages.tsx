"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AUTOPLAY_MS, galleryReducer, initialGallery, keyAction, visibleSlots } from "@/lib/gallery";
import { canAutoAdvance, shouldAutoplayVideo, toGalleryMedia, videoKeepsKey, type GalleryItem, type MediaInput } from "@/lib/galleryMedia";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/icons";

const zoomArrow =
  "pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white transition-colors hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold";

const arrow =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-700 transition-colors hover:border-brand-gold hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold";

// Starts a video playing, silently, unless the shopper asked for less motion or less data. Otherwise it waits for a tap.
const useVideoAutoplay = (video: React.RefObject<HTMLVideoElement>) => {
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ?? false;
    if (shouldAutoplayVideo({ reducedMotion, saveData })) el.play().catch(() => {});
  }, [video]);
};

// Silent and inline so a phone plays it on the page. It is not downloaded until it is shown, and the controls let the shopper pause or unmute.
const ProductVideo = ({ src, poster, label, className }: { src: string; poster: string; label: string; className: string }) => {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useVideoAutoplay(video);
  // A video that is gone or cannot be played shows its still picture and says so, not a frozen picture with dead controls.
  if (failed) {
    return (
      <>
        <Image src={poster} alt="" fill unoptimized className="object-contain opacity-60" />
        <p role="status" className="absolute inset-x-0 bottom-3 px-4 text-center text-sm text-white">
          This video could not be played.
        </p>
      </>
    );
  }
  return <video ref={video} src={src} poster={poster} aria-label={label} muted loop playsInline controls preload="none" onError={() => setFailed(true)} className={className} />;
};

// A small mark on a video's tile in the strip, so it is not taken for a photo.
const PlayMark = () => (
  <span data-play-mark aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white">
      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden="true">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  </span>
);

// The photo (or video) at full screen. Tapping it zooms in, tapping again zooms out, and the shopper can pinch for more.
export const ZoomView = ({
  url,
  videoUrl,
  count,
  magnified,
  onClose,
  onNext,
  onPrev,
  onToggle,
}: {
  url: string;
  videoUrl?: string | null;
  count: number;
  magnified: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggle: () => void;
}) => {
  const scroller = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  // A zoomed photo opens centred, so the shopper starts from the middle of the watch.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !magnified) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
  }, [magnified]);

  // Keeps Tab inside the view while it is open.
  const keepFocusInside = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab" || !dialog.current) return;
    const buttons = Array.from(dialog.current.querySelectorAll<HTMLElement>("button"));
    if (buttons.length === 0) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={videoUrl ? "Product video" : "Product photo"}
      onKeyDown={keepFocusInside}
      className="fixed inset-0 z-[60] flex flex-col bg-black pt-[env(safe-area-inset-top)]"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-white/80">
        <span>{videoUrl ? "Product video" : "Tap the photo to zoom, pinch for more"}</span>
        <button
          type="button"
          data-close
          aria-label="Close zoomed photo"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
        >
          <CloseIcon className="h-6 w-6" />
        </button>
      </div>

      {videoUrl ? (
        <div className="relative min-h-0 flex-1">
          <ProductVideo key={videoUrl} src={videoUrl} poster={url} label="Product video" className="h-full w-full object-contain" />
        </div>
      ) : (
        <div ref={scroller} className="relative min-h-0 flex-1 overflow-auto">
          <button
            type="button"
            data-magnified={magnified}
            aria-label={magnified ? "Zoom out" : "Zoom in"}
            onClick={onToggle}
            className={`relative block ${magnified ? "h-[250%] w-[250%] cursor-zoom-out" : "h-full w-full cursor-zoom-in"}`}
          >
            <Image src={url} alt="" fill sizes={magnified ? "250vw" : "100vw"} className="object-contain" />
          </button>
        </div>
      )}

      {count > 1 && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-2">
          <button
            type="button"
            aria-label="Previous photo"
            onClick={onPrev}
            className={zoomArrow}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={onNext}
            className={zoomArrow}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

const Gallery = ({ media, name }: { media: GalleryItem[]; name?: string }) => {
  const [state, dispatch] = useReducer(galleryReducer, media.length, initialGallery);
  const current = media[state.index];
  const onVideo = current.kind === "video";
  const mainButton = useRef<HTMLButtonElement>(null);
  const videoStage = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<number | null>(null);
  const wasZoomed = useRef(false);

  // The photos move on by themselves until the shopper takes over, or if they ask their phone for less motion. A video is left to play.
  useEffect(() => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (!canAutoAdvance({ auto: state.auto, zoom: state.zoom, count: state.count, reducedMotion, onVideo })) return;
    const timer = setInterval(() => dispatch({ type: "tick" }), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [state.auto, state.zoom, state.count, onVideo]);

  // While the zoom view is open: the page behind does not scroll, keys work, and focus goes back to the photo afterwards.
  useEffect(() => {
    if (state.zoom) {
      wasZoomed.current = true;
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      document.querySelector<HTMLElement>("[data-close]")?.focus();
      const onKey = (event: KeyboardEvent) => {
        const action = keyAction(event.key, true);
        if (!action || videoKeepsKey(action, event.target as Element | null)) return;
        event.preventDefault();
        dispatch({ type: action });
      };
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = previous;
        window.removeEventListener("keydown", onKey);
      };
    }
    if (wasZoomed.current) {
      wasZoomed.current = false;
      (mainButton.current ?? videoStage.current)?.focus();
    }
  }, [state.zoom]);

  const slots = visibleSlots(state.index, media.length);

  const onTouchEnd = (event: React.TouchEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (start === null) return;
    const moved = event.changedTouches[0].clientX - start;
    if (Math.abs(moved) > 40) dispatch({ type: moved < 0 ? "next" : "prev" });
  };

  return (
    <div
      onKeyDown={(event) => {
        if (state.zoom) return; // the zoom view listens to the keys itself
        const action = keyAction(event.key, false);
        if (videoKeepsKey(action, event.target as Element | null)) return;
        if (action === "next" || action === "prev") dispatch({ type: action });
      }}
    >
      {onVideo ? (
        <div
          ref={videoStage}
          tabIndex={-1}
          data-main-video
          className="relative block h-[min(320px,42vh)] w-full overflow-hidden rounded-md bg-black focus:outline-none sm:h-[400px] lg:h-[500px]"
        >
          <ProductVideo
            key={current.id}
            src={current.videoUrl ?? ""}
            poster={current.url}
            label={name ? `${name} video` : "Product video"}
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        <button
          ref={mainButton}
          type="button"
          data-main-photo
          aria-haspopup="dialog"
          aria-label="Zoom in on the photo"
          onClick={() => dispatch({ type: "openZoom" })}
          onTouchStart={(event) => {
            swipeStart.current = event.touches.length === 1 ? event.touches[0].clientX : null;
          }}
          onTouchMove={(event) => {
            if (event.touches.length > 1) swipeStart.current = null; // a pinch is not a swipe
          }}
          onTouchEnd={onTouchEnd}
          className="relative block h-[min(320px,42vh)] w-full cursor-zoom-in overflow-hidden rounded-md bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold sm:h-[400px] lg:h-[500px]"
        >
          <Image
            src={current.url}
            alt={name ?? ""}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover transition-opacity duration-500"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white"
          >
            Tap to zoom
          </span>
        </button>
      )}

      {media.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button type="button" aria-label="Previous photo" onClick={() => dispatch({ type: "prev" })} className={arrow}>
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          <div className="flex items-center justify-center gap-3">
            {slots.map(({ index, role }) =>
              role === "current" ? (
                <div
                  key={media[index].id}
                  data-slot={role}
                  aria-current="true"
                  className="relative h-20 w-20 overflow-hidden rounded-md ring-2 ring-brand-gold"
                >
                  <Image src={media[index].url} alt="" fill sizes="80px" unoptimized={media[index].kind === "video"} className="object-cover" />
                  {media[index].kind === "video" && <PlayMark />}
                </div>
              ) : (
                <button
                  key={media[index].id}
                  type="button"
                  data-slot={role}
                  aria-label={`Show ${media[index].kind} ${index + 1} of ${media.length}`}
                  onClick={() => dispatch({ type: "select", index })}
                  className="relative h-14 w-14 overflow-hidden rounded-md opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                >
                  <Image src={media[index].url} alt="" fill sizes="56px" unoptimized={media[index].kind === "video"} className="object-cover" />
                  {media[index].kind === "video" && <PlayMark />}
                </button>
              )
            )}
          </div>

          <button type="button" aria-label="Next photo" onClick={() => dispatch({ type: "next" })} className={arrow}>
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {media.length > 1 && !onVideo && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            aria-pressed={!state.auto}
            onClick={() => dispatch({ type: "toggleAuto" })}
            className="rounded px-2 py-2 text-xs text-gray-500 underline underline-offset-4 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          >
            {state.auto ? "Pause photos" : "Play photos"}
          </button>
        </div>
      )}

      {state.zoom &&
        createPortal(
          <ZoomView
            url={current.url}
            videoUrl={current.videoUrl}
            count={media.length}
            magnified={state.magnified}
            onClose={() => dispatch({ type: "closeZoom" })}
            onNext={() => dispatch({ type: "next" })}
            onPrev={() => dispatch({ type: "prev" })}
            onToggle={() => dispatch({ type: "toggleMagnify" })}
          />,
          document.body
        )}
    </div>
  );
};

// `name` is the product's name: the main photo carries it as its text, so the picture can be found in image search.
// The items are the store's photos and videos; a video is shown by its still picture until it is picked.
const ProductImages = ({ items, name }: { items?: MediaInput[] | null; name?: string }) => {
  const media = useMemo(() => toGalleryMedia(items), [items]);
  if (media.length === 0) return null;
  return <Gallery media={media} name={name} />;
};

export default ProductImages;
