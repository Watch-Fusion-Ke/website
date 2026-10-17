"use client";

import { useEffect, useMemo, useState } from "react";
import { useWixClient } from "@/hooks/useWixClient";
import { createCategoryLoader, pickCategories, type Category, type CategoryLink } from "@/lib/categories";

let loader: ReturnType<typeof createCategoryLoader> | null = null;

// The shop's category list, shared by everything on the page that shows it. Starts empty and fills in
// once the shop answers, so the page itself never waits for it.
export const useAllCategories = (): Category[] => {
  const wixClient = useWixClient();
  const [items, setItems] = useState<Category[]>([]);

  useEffect(() => {
    let live = true;
    loader ??= createCategoryLoader(async () => (await wixClient.collections.queryCollections().find()).items);
    loader().then((found) => live && setItems(found));
    return () => {
      live = false;
    };
  }, [wixClient]);

  return items;
};

const useCategories = (max = 6): CategoryLink[] => {
  const items = useAllCategories();
  return useMemo(() => pickCategories(items, max), [items, max]);
};

export default useCategories;
