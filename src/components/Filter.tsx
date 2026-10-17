"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Builds the address for a changed choice. An empty value removes the choice, and the page number is
// always dropped, so a filter that shortens the list can never leave the shopper on a page past its end.
export const nextUrl = (
  pathname: string,
  current: URLSearchParams,
  changes: Record<string, string>
): string => {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(changes)) {
    if (value === "") params.delete(key);
    else params.set(key, value);
  }
  params.delete("page");
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
};

const SORTS = [
  { value: "desc lastUpdated", label: "Newest first" },
  { value: "asc price", label: "Price: low to high" },
  { value: "desc price", label: "Price: high to low" },
];

const field =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-gold";
const label = "mb-1 block text-xs font-medium text-gray-600";

const Filter = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  const sort = searchParams.get("sort") ?? "";
  const min = searchParams.get("min") ?? "";
  const max = searchParams.get("max") ?? "";
  const hasPrice = min !== "" || max !== "";

  const applyPrice = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    replace(
      nextUrl(pathname, searchParams, {
        min: String(data.get("min") ?? "").trim(),
        max: String(data.get("max") ?? "").trim(),
      })
    );
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <form onSubmit={applyPrice} className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="filter-min" className={label}>Min price</label>
          <input
            id="filter-min"
            name="min"
            type="text"
            inputMode="numeric"
            defaultValue={min}
            placeholder="KES"
            className={`${field} w-28`}
          />
        </div>
        <div>
          <label htmlFor="filter-max" className={label}>Max price</label>
          <input
            id="filter-max"
            name="max"
            type="text"
            inputMode="numeric"
            defaultValue={max}
            placeholder="KES"
            className={`${field} w-28`}
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand-navy px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-gold hover:text-brand-navy"
        >
          Apply
        </button>
        {hasPrice && (
          <Link
            href={nextUrl(pathname, searchParams, { min: "", max: "" })}
            className="py-2 text-sm font-medium text-gray-600 underline underline-offset-4 hover:text-brand-navy"
          >
            Clear
          </Link>
        )}
      </form>

      <div>
        <label htmlFor="filter-sort" className={label}>Sort by</label>
        <select
          id="filter-sort"
          name="sort"
          defaultValue={sort}
          className={`${field} w-full sm:w-52`}
          onChange={(e) => replace(nextUrl(pathname, searchParams, { sort: e.target.value }))}
        >
          <option value="">Default</option>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Filter;
