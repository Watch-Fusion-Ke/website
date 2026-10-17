import { describe, expect, it } from "vitest";
import { attachDismiss } from "@/lib/dismiss";

// A stand-in for the document that lets a test send events with a chosen target.
const fakeDocument = () => {
  const listeners = new Map<string, Set<(e: Event) => void>>();
  return {
    addEventListener: (type: string, fn: (e: Event) => void) => void (listeners.get(type) ?? listeners.set(type, new Set()).get(type)!).add(fn),
    removeEventListener: (type: string, fn: (e: Event) => void) => void listeners.get(type)?.delete(fn),
    send: (type: string, event: object) => listeners.get(type)?.forEach((fn) => fn(event as Event)),
  };
};

const setup = () => {
  const doc = fakeDocument();
  const inside = { id: "inside" };
  const outside = { id: "outside" };
  let dismissed = 0;
  const stop = attachDismiss(doc, (node) => node === inside, () => dismissed++);
  return { doc, inside, outside, stop, count: () => dismissed };
};

describe("attachDismiss", () => {
  it("dismisses when Escape is pressed anywhere", () => {
    const { doc, count } = setup();
    doc.send("keydown", { key: "Escape" });
    expect(count()).toBe(1);
  });

  it("ignores other keys", () => {
    const { doc, count } = setup();
    doc.send("keydown", { key: "Enter" });
    doc.send("keydown", { key: "a" });
    expect(count()).toBe(0);
  });

  it("dismisses when the shopper presses outside the box, but not inside it", () => {
    const { doc, inside, outside, count } = setup();
    doc.send("pointerdown", { target: inside });
    expect(count()).toBe(0);
    doc.send("pointerdown", { target: outside });
    expect(count()).toBe(1);
  });

  it("stops listening once removed", () => {
    const { doc, outside, stop, count } = setup();
    stop();
    doc.send("keydown", { key: "Escape" });
    doc.send("pointerdown", { target: outside });
    expect(count()).toBe(0);
  });
});
