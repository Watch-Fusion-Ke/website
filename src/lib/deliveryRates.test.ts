import { describe, expect, it } from "vitest";
import { parseRates } from "@/lib/deliveryRates";

const row = (data: Record<string, unknown>, id = "i1") => ({ _id: id, data });

describe("parseRates", () => {
  it("reads the places, road and price of each row", () => {
    expect(parseRates([row({ title: "UNEP / GIGIRI", road: "Limuru Road", price: 450 })])).toEqual([
      { id: "i1", places: "UNEP / GIGIRI", road: "Limuru Road", price: 450 },
    ]);
  });

  it("accepts a price typed as text, with a comma", () => {
    expect(parseRates([row({ title: "A", road: "R", price: "1,250" })])[0].price).toBe(1250);
  });

  it("skips rows that are switched off", () => {
    expect(parseRates([row({ title: "A", road: "R", price: 100, isActive: false })])).toEqual([]);
    expect(parseRates([row({ title: "A", road: "R", price: 100, isActive: true })])).toHaveLength(1);
    expect(parseRates([row({ title: "A", road: "R", price: 100 })])).toHaveLength(1);
  });

  it("keeps a row priced at zero, since an area can be free", () => {
    expect(parseRates([row({ title: "CBD pickup", road: "R", price: 0 })])[0].price).toBe(0);
  });

  it("reads a price written with KES or Ksh in front", () => {
    expect(parseRates([row({ title: "A", road: "R", price: "KES 450" })])[0].price).toBe(450);
    expect(parseRates([row({ title: "A", road: "R", price: "Ksh 1,250" })])[0].price).toBe(1250);
  });

  it("skips rows with no places or with a price that is missing, blank, negative or not a number", () => {
    const bad = [
      row({ title: "", road: "R", price: 100 }, "a"),
      row({ title: "A", road: "R" }, "b"),
      row({ title: "A", road: "R", price: "  " }, "c"),
      row({ title: "A", road: "R", price: -5 }, "d"),
      row({ title: "A", road: "R", price: "abc" }, "e"),
      { _id: "f" },
    ];
    expect(parseRates(bad)).toEqual([]);
  });

  it("rounds a price to whole shillings and refuses an absurd one", () => {
    expect(parseRates([row({ title: "A", road: "R", price: 449.6 })])[0].price).toBe(450);
    expect(parseRates([row({ title: "A", road: "R", price: 99999999 })])).toEqual([]);
  });

  it("copes with a missing road", () => {
    expect(parseRates([row({ title: "A", price: 100 })])[0].road).toBe("");
  });
});
