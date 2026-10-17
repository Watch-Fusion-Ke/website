import { describe, expect, it } from "vitest";
import {
  DELIVERY_PREFIX,
  areasFromRates,
  deliveryLineName,
  formatKes,
  isDeliveryLine,
  needsDeliveryArea,
  searchAreas,
  type DeliveryRate,
} from "@/lib/delivery";

const rates: DeliveryRate[] = [
  { id: "r1", places: "NYAYO STADIUM / BUNYALA", road: "Mombasa Road", price: 250 },
  { id: "r2", places: "UNEP / GIGIRI / VILLAGE MARKET", road: "Limuru Road", price: 450 },
  { id: "r3", places: "NAIROBI WEST / SOUTH B / SOUTH C", road: "Mombasa Road", price: 350 },
  { id: "r4", places: "NAIROBI WEST", road: "Langata Road", price: 350 },
  { id: "r5", places: "Kilimani / Hurlingham", road: "Ngong Road", price: 300 },
  { id: "r6", places: "*DELTA / MUTHEHTHI", road: "Kiambu Road", price: 500 },
];
const areas = areasFromRates(rates);

describe("areasFromRates", () => {
  it("gives every place on a rate its own entry with the rate's road and price", () => {
    const gigiri = areas.find((a) => a.place === "Gigiri");
    expect(gigiri).toMatchObject({ road: "Limuru Road", price: 450 });
    expect(areas.filter((a) => a.road === "Limuru Road")).toHaveLength(3);
  });

  it("writes shouting capitals in normal capitals and leaves mixed case alone", () => {
    expect(areas.map((a) => a.place)).toContain("Nyayo Stadium");
    expect(areas.map((a) => a.place)).toContain("Kilimani");
  });

  it("drops stray marks such as a leading asterisk", () => {
    expect(areas.map((a) => a.place)).toContain("Delta");
  });

  it("gives each entry an id that is stable and unique, built from the rate it came from", () => {
    const ids = areas.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(areasFromRates(rates).map((a) => a.id)).toEqual(ids);
    expect(areas[0].id.startsWith("r1")).toBe(true);
  });

  it("skips empty names", () => {
    expect(areasFromRates([{ id: "x", places: " / ,/ ", road: "R", price: 100 }])).toEqual([]);
  });
});

describe("searchAreas", () => {
  const names = (q: string) => searchAreas(areas, q).map((a) => `${a.place} (${a.road})`);

  it("finds a place from the first letters, in any case", () => {
    expect(names("gig")).toEqual(["Gigiri (Limuru Road)"]);
    expect(names("KILI")).toEqual(["Kilimani (Ngong Road)"]);
  });

  it("finds a place from any word in its name", () => {
    expect(names("stadium")).toEqual(["Nyayo Stadium (Mombasa Road)"]);
  });

  it("shows the same place once for each road it is on, so the shopper picks the right fee", () => {
    expect(names("nairobi west")).toEqual(["Nairobi West (Langata Road)", "Nairobi West (Mombasa Road)"]);
  });

  it("puts places that start with the typing before places that only contain it", () => {
    const first = searchAreas(areas, "south")[0];
    expect(first.place).toBe("South B");
  });

  it("also matches the road name", () => {
    expect(names("ngong").length).toBeGreaterThan(0);
    expect(names("limuru")).toEqual(expect.arrayContaining(["Gigiri (Limuru Road)"]));
  });

  it("needs every word typed to match", () => {
    expect(names("gigiri mombasa")).toEqual([]);
  });

  it("ignores a single letter, empty typing and stray punctuation", () => {
    expect(searchAreas(areas, "g")).toEqual([]);
    expect(searchAreas(areas, "   ")).toEqual([]);
    expect(names("  kil.. ")).toEqual(["Kilimani (Ngong Road)"]);
  });

  it("never returns more than the limit", () => {
    expect(searchAreas(areas, "ro", 2).length).toBeLessThanOrEqual(2);
  });
});

describe("delivery cart line", () => {
  it("is named with the place, the road and nothing the shopper could mistake for a product", () => {
    const area = areas.find((a) => a.place === "Gigiri")!;
    expect(deliveryLineName(area)).toBe("Delivery: Gigiri, Limuru Road");
    expect(deliveryLineName(area).startsWith(DELIVERY_PREFIX)).toBe(true);
  });

  it("is recognised by its name, and a product is not mistaken for it", () => {
    expect(isDeliveryLine({ productName: { original: "Delivery: Gigiri, Limuru Road" } })).toBe(true);
    expect(isDeliveryLine({ productName: { original: "Naviforce NF9269" } })).toBe(false);
    expect(isDeliveryLine({ productName: { original: "Home Delivery Kit" } })).toBe(false);
    expect(isDeliveryLine({})).toBe(false);
  });
});

describe("formatKes", () => {
  it("writes whole shillings with thousands commas", () => {
    expect(formatKes(1250)).toBe("KES 1,250");
    expect(formatKes(0)).toBe("KES 0");
  });
});

describe("needsDeliveryArea", () => {
  const product = { productName: { original: "Watch" } };
  const fee = { productName: { original: "Delivery: Gigiri, Limuru Road" } };

  it("lets checkout through when the shop could not add the fee, so a fault never stops a sale", () => {
    expect(needsDeliveryArea(true, [product], true)).toBe(false);
    expect(needsDeliveryArea(true, [product], false)).toBe(true);
  });

  it("holds checkout back only when delivery fees are on and no area has been chosen", () => {
    expect(needsDeliveryArea(true, [product])).toBe(true);
    expect(needsDeliveryArea(true, [product, fee])).toBe(false);
    expect(needsDeliveryArea(false, [product])).toBe(false);
    expect(needsDeliveryArea(false, [product, fee])).toBe(false);
  });
});
