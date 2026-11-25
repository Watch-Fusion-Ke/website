"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { SpecRow } from "@/lib/productSpecs";
import { rowDelayMs, startingPhase, type Phase } from "@/lib/specReveal";

type Props = {
  specs: SpecRow[];
  features?: string[];
};

// The column this sits in is narrow on a computer and wide on a tablet, so the rows follow the box, not the screen.
const SIDE_BY_SIDE = "[@container(min-width:26rem)]:grid-cols-[minmax(0,10rem)_1fr]";

// These class names are written out here, not in a lib file, because the stylesheet build reads only components and app.
export const lineClass = (phase: Phase) =>
  [
    "mt-2 block h-0.5 w-14 origin-left bg-brand-gold motion-reduce:transition-none print:scale-x-100",
    phase === "armed" ? "scale-x-0" : "scale-x-100",
    phase === "shown" ? "transition-transform duration-700 ease-out" : "",
  ].join(" ");

// Only the opacity and the position move, so a colour change later is never held back by the stagger delay set on each row.
export const rowClass = (phase: Phase) =>
  [
    "grid gap-x-6 gap-y-0.5 px-4 py-2.5 motion-reduce:transition-none print:opacity-100 print:translate-y-0 sm:py-3",
    SIDE_BY_SIDE,
    phase === "armed" ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
    phase === "shown" ? "transition-[opacity,transform] duration-500 ease-out" : "",
  ].join(" ");

export default function ProductSpecs({ specs, features = [] }: Props) {
  const headingId = useId();
  const table = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<Phase>("static");

  useEffect(() => {
    const el = table.current;
    if (!el) return;
    const start = startingPhase({
      hasObserver: typeof IntersectionObserver !== "undefined",
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      top: el.getBoundingClientRect().top,
      viewportHeight: window.innerHeight,
    });
    if (start === "static") return;
    setPhase(start);
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase("shown");
          watcher.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    watcher.observe(el);
    return () => watcher.disconnect();
  }, []);

  const rowDelay = (index: number) => (phase === "shown" ? { transitionDelay: `${rowDelayMs(index)}ms` } : undefined);

  return (
    <div className="flex flex-col gap-6">
      {features.length > 0 && (
        <ul aria-label="Key features" className="flex flex-col gap-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
              {feature}
            </li>
          ))}
        </ul>
      )}

      <section ref={table} aria-labelledby={headingId}>
        <h3 id={headingId} className="font-display text-2xl font-semibold text-gray-900">
          Specifications
        </h3>
        <span data-spec-line="" aria-hidden="true" className={lineClass(phase)} />
        <dl className="mt-4 [container-type:inline-size] divide-y divide-gray-200 border-y border-gray-200">
          {specs.map((spec, index) => (
            <div key={index} data-spec-row="" className={rowClass(phase)} style={rowDelay(index)}>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 [@container(min-width:26rem)]:pt-0.5">{spec.label}</dt>
              <dd className="min-w-0 break-words text-sm font-semibold text-gray-900 first-letter:uppercase">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
