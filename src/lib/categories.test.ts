import { describe, expect, it } from "vitest";
import { createCategoryLoader, pickCategories } from "@/lib/categories";

const items = [
  { _id: "all", name: "All Products", slug: "all-products" },
  { _id: "a", name: "Ladies Watches", slug: "ladies-watches" },
  { _id: "b", name: "Gent's Watches", slug: "gents-watches" },
  { _id: "c", name: "", slug: "no-name" },
  { _id: "d", name: "No slug", slug: "" },
  { _id: "e", name: "Naviforce", slug: "naviforce" },
];

describe("pickCategories", () => {
  it("drops the store's own All Products, nameless and slugless entries", () => {
    expect(pickCategories(items, 10).map((c) => c.slug)).toEqual(["ladies-watches", "gents-watches", "naviforce"]);
  });

  it("keeps at most the number asked for, in the shop's order", () => {
    expect(pickCategories(items, 2).map((c) => c.slug)).toEqual(["ladies-watches", "gents-watches"]);
  });
});

describe("createCategoryLoader", () => {
  it("asks the shop once, however many parts of the page want the categories", async () => {
    let calls = 0;
    const load = createCategoryLoader(async () => {
      calls++;
      return items;
    });
    const [a, b] = await Promise.all([load(), load()]);
    await load();
    expect(calls).toBe(1);
    expect(a).toBe(b);
  });

  it("gives an empty list and tries again next time when the shop cannot be reached", async () => {
    let calls = 0;
    const load = createCategoryLoader(async () => {
      calls++;
      if (calls === 1) throw new Error("down");
      return items;
    });
    expect(await load()).toEqual([]);
    expect((await load()).length).toBe(items.length);
    expect(calls).toBe(2);
  });
});
