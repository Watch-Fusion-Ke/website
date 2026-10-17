"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { attachDismiss } from "@/lib/dismiss";
import { WHATSAPP_URL } from "@/lib/contact";
import { formatKes, searchAreas, type DeliveryArea } from "@/lib/delivery";

type ViewProps = {
  areas: DeliveryArea[];
  query: string;
  onQuery: (q: string) => void;
  onPick: (area: DeliveryArea) => void;
  onChange: () => void;
  busy: boolean;
  error: string | null;
  selectedLabel?: string | null;
  selectedPrice?: number | null;
  activeIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  // Whether the list of matches is showing. It closes on Escape or a press outside, and opens again on typing.
  open?: boolean;
  onFocusInput?: () => void;
};

// What the shopper sees: a search box for the delivery area, the matching areas with their fee, or the chosen area.
export const DeliveryPickerView = ({
  areas,
  query,
  onQuery,
  onPick,
  onChange,
  busy,
  error,
  selectedLabel,
  selectedPrice,
  activeIndex = -1,
  onKeyDown,
  open = true,
  onFocusInput,
}: ViewProps) => {
  const id = useId();
  const listId = `${id}-list`;
  const matches = useMemo(() => searchAreas(areas, query, 40), [areas, query]);
  const typed = query.trim().length >= 2 && open;

  if (selectedLabel) {
    return (
      <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 p-4">
        <div>
          <p className="text-xs font-medium text-gray-500">Delivering to</p>
          <p className="font-semibold text-gray-900">{selectedLabel}</p>
          {selectedPrice != null && <p className="text-sm text-gray-700">Delivery fee {formatKes(selectedPrice)}</p>}
        </div>
        <button type="button" onClick={onChange} disabled={busy} className="py-1 text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-gray-900 disabled:opacity-50">
          Change
        </button>
      </div>
    );
  }

  return (
    <div aria-busy={busy}>
      <label htmlFor={`${id}-input`} className="mb-1 block text-sm font-semibold text-gray-900">Where should we deliver?</label>
      <input
        id={`${id}-input`}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={typed && matches.length > 0}
        aria-controls={typed && matches.length > 0 ? listId : undefined}
        aria-activedescendant={activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined}
        autoComplete="off"
        value={query}
        readOnly={busy}
        onChange={(e) => onQuery(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocusInput}
        placeholder="Type your area, for example Kilimani"
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-gold read-only:opacity-60"
      />

      {typed && matches.length > 0 && (
        <ul id={listId} role="listbox" aria-label="Delivery areas" className="mt-2 max-h-64 overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white">
          {matches.map((area, i) => (
            <li
              key={area.id}
              id={`${id}-opt-${i}`}
              role="option"
              ref={(el) => {
                if (i === activeIndex) el?.scrollIntoView?.({ block: "nearest" });
              }}
              aria-selected={i === activeIndex}
              onClick={() => onPick(area)}
              className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-2 text-sm hover:bg-gray-100 ${i === activeIndex ? "bg-gray-100" : ""}`}
            >
              <span>
                <span className="font-medium text-gray-900">{area.place}</span>
                {area.road && <span className="block text-xs text-gray-500">{area.road}</span>}
              </span>
              <span className="whitespace-nowrap font-semibold text-gray-900">{formatKes(area.price)}</span>
            </li>
          ))}
        </ul>
      )}

      {typed && matches.length === 0 && (
        <p className="mt-2 text-sm text-gray-600">
          No area matches &ldquo;{query.trim()}&rdquo;. Not listed?{" "}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 underline underline-offset-4">
            Message us on WhatsApp<span className="sr-only"> (opens in a new tab)</span>
          </a>
          .
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

type Props = {
  areas: DeliveryArea[];
  selectedLabel: string | null;
  selectedPrice: number | null;
  // Saves the chosen area. Rejects with a message the shopper can read when it fails.
  onChosen: (area: DeliveryArea) => Promise<void>;
};

const DeliveryPicker = ({ areas, selectedLabel, selectedPrice, onChosen }: Props) => {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(true);
  const box = useRef<HTMLDivElement>(null);

  // Escape, or a press outside the box, closes the list.
  useEffect(() => attachDismiss(document, (node) => !!box.current && node instanceof Node && box.current.contains(node), () => setOpen(false)), []);
  const matches = useMemo(() => searchAreas(areas, query, 40), [areas, query]);

  const pick = async (area: DeliveryArea) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onChosen(area);
      setQuery("");
      setEditing(false);
      setActive(-1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not save that. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && (matches[active] || matches.length === 1)) {
      e.preventDefault();
      void pick(matches[active] ?? matches[0]);
    } else if (e.key === "Escape") {
      setActive(-1);
    }
  };

  return (
    <div ref={box}>
    <DeliveryPickerView
      areas={areas}
      query={query}
      onQuery={(q) => {
        setQuery(q);
        setActive(-1);
        setOpen(true);
      }}
      open={open}
      onFocusInput={() => setOpen(true)}
      onPick={pick}
      onChange={() => setEditing(true)}
      busy={busy}
      error={error}
      selectedLabel={editing ? null : selectedLabel}
      selectedPrice={selectedPrice}
      activeIndex={active}
      onKeyDown={onKeyDown}
    />
    </div>
  );
};

export default DeliveryPicker;
