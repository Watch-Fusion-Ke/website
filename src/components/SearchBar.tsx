"use client";

import Image from "next/image";
import { OPEN_SEARCH_EVENT } from "@/lib/productSearch";

// The search box in the header does not search in place: it opens the full search page, which has the results as you type.
// It opens on a click, Enter or Space and never on focus alone, because closing the page puts focus back here.
const SearchBar = () => {
  const open = () => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));

  return (
    <div className="flex items-center justify-between gap-3 bg-gray-100 px-4 py-2.5 rounded-lg flex-1">
      <input
        type="text"
        name="name"
        readOnly
        placeholder="Search watches"
        aria-label="Search watches"
        aria-haspopup="dialog"
        autoComplete="off"
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
        className="flex-1 cursor-text bg-transparent outline-none"
      />
      <button type="button" className="cursor-pointer" aria-label="Search" aria-haspopup="dialog" onClick={open}>
        <Image src="/search.png" alt="" width={16} height={16} className="dark:invert" />
      </button>
    </div>
  );
};

export default SearchBar;
