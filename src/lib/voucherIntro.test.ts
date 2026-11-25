import { describe, expect, it } from "vitest";
import { INTRO_SEEN_KEY, introSeen, markIntroSeen } from "@/lib/voucherIntro";

const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
};
const broken = {
  getItem: () => {
    throw new Error("storage blocked");
  },
  setItem: () => {
    throw new Error("storage blocked");
  },
};

describe("showing the voucher introduction only the first time", () => {
  it("has not been seen on a first visit, and has once it is marked", () => {
    const storage = memory();
    expect(introSeen(storage)).toBe(false);
    markIntroSeen(storage);
    expect(introSeen(storage)).toBe(true);
    expect(storage.getItem(INTRO_SEEN_KEY)).toBe("1");
  });

  it("counts a browser that blocks storage as not having seen it, and never throws", () => {
    expect(introSeen(broken)).toBe(false);
    expect(() => markIntroSeen(broken)).not.toThrow();
  });

  it("counts a missing storage as not having seen it", () => {
    expect(introSeen(null)).toBe(false);
    expect(() => markIntroSeen(null)).not.toThrow();
  });
});
