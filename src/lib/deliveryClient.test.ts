import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadDeliveryOptions } from "@/lib/deliveryClient";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const answer = (json: unknown, status = 200) => async () => new Response(JSON.stringify(json), { status });

describe("loadDeliveryOptions", () => {
  it("returns what the server says", async () => {
    const areas = [{ id: "a:0", place: "Gigiri", road: "R", price: 450 }];
    expect(await loadDeliveryOptions(answer({ enabled: true, areas }))).toEqual({ enabled: true, areas });
  });

  it("is off when the server says it is off, errors, or sends nonsense", async () => {
    expect(await loadDeliveryOptions(answer({ enabled: false, areas: [] }))).toEqual({ enabled: false, areas: [] });
    expect(await loadDeliveryOptions(answer({}, 500))).toEqual({ enabled: false, areas: [] });
    expect(await loadDeliveryOptions(async () => new Response("<html>", { status: 200 }))).toEqual({ enabled: false, areas: [] });
    expect(await loadDeliveryOptions(async () => { throw new Error("offline"); })).toEqual({ enabled: false, areas: [] });
  });

  it("gives up after five seconds and treats delivery as off, so a slow server can never keep checkout shut", async () => {
    const hang = (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))));
    const pending = loadDeliveryOptions(hang);
    await vi.advanceTimersByTimeAsync(5000);
    expect(await pending).toEqual({ enabled: false, areas: [] });
  });

  it("does not give up early", async () => {
    let settled = false;
    const hang = (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))));
    loadDeliveryOptions(hang).then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(4900);
    expect(settled).toBe(false);
  });
});
