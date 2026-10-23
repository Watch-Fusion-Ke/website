import * as React from "react";
import { wixClientServer } from "@/lib/wixClientServer";
import { loadCategoryPages, type CategoryPage } from "@/lib/categoryPages";

// Next's server build of React remembers a function's answer for the length of one page request; other builds (the tests) have no
// such memory and just call it each time.
const forOneRequest = <T extends (...args: never[]) => Promise<unknown>>(fn: T): T => {
  const cache = (React as unknown as { cache?: <F>(f: F) => F }).cache;
  return cache ? cache(fn) : fn;
};

// The store's categories, read once for a whole page request however many parts of the page ask. Server only.
export const getCategoryPages = forOneRequest(async (): Promise<CategoryPage[]> => {
  const wixClient = await wixClientServer();
  return loadCategoryPages((url, init) => wixClient.fetchWithAuth(url, init));
});
