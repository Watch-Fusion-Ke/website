"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export type ShowcaseWatch = { id: string; name: string; imageUrl: string; priceLabel: string; slug?: string };

const SLIDE_MS = 4000;

// A few of the shop's watches fading one into the next beside the sign-in form.
const AuthShowcase = ({ watches, className = "" }: { watches: ShowcaseWatch[]; className?: string }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = watches.length;

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => clearInterval(timer);
  }, [paused, count]);

  if (count === 0) return null;

  return (
    <section
      aria-label="Our watches"
      className={`relative overflow-hidden rounded-2xl bg-brand-navy ring-1 ring-brand-gold/40 ${className}`}
    >
      {watches.map((watch, i) => (
        <figure
          key={watch.id}
          data-slide
          aria-hidden={i === index ? "false" : "true"}
          className={`absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 transition-opacity duration-700 ${
            i === index ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {(() => {
            const content = (
              <>
              <div className="relative h-2/3 min-h-[7rem] w-full max-w-xs overflow-hidden rounded-xl bg-white lg:h-[22rem] lg:max-w-sm">
                <Image
                  src={watch.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 384px, 70vw"
                  priority={i === 0}
                  className="object-contain"
                />
              </div>
              <figcaption className="text-center">
                <span className="block font-display text-lg font-bold text-white lg:text-2xl">{watch.name}</span>
                {watch.priceLabel && <span className="mt-1 block text-sm text-brand-gold">{watch.priceLabel}</span>}
              </figcaption>
              </>
            );
            return watch.slug ? (
              <Link
                href={`/${watch.slug}`}
                aria-label={`View ${watch.name}${watch.priceLabel ? `, ${watch.priceLabel}` : ""}`}
                tabIndex={i === index ? 0 : -1}
                className="group flex h-full w-full flex-col items-center justify-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
              >
                {content}
              </Link>
            ) : (
              content
            );
          })()}
        </figure>
      ))}

      {count > 1 && (
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
          className="absolute bottom-2 right-3 rounded px-2 py-2 text-xs text-white/80 underline underline-offset-4 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
        >
          {paused ? "Play" : "Pause"}
        </button>
      )}
    </section>
  );
};

export default AuthShowcase;
