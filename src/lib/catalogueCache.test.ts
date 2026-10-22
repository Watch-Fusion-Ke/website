import { describe, expect, it } from "vitest";
import { cachedFetch, clearCatalogueCache } from "@/lib/catalogueCache";

const counting = (status = 200) => {
  const calls: string[] = [];
  const fetchLike = async (_url: string, init?: RequestInit) => {
    calls.push(String(init?.body));
    return new Response(JSON.stringify({ products: [calls.length] }), { status });
  };
  return { calls, fetchLike };
};
const ask = async (fetchLike: typeof fetch | ((u: string, i?: RequestInit) => Promise<Response>), body = "{}") =>
  (await fetchLike("https://wix/search", { method: "POST", body })).json();

describe("remembering the shop's product list for a minute", () => {
  it("asks the shop once, then answers the same request from memory", async () => {
    clearCatalogueCache();
    const { calls, fetchLike } = counting();
    const cached = cachedFetch(fetchLike, () => 1000);
    expect(await ask(cached)).toEqual({ products: [1] });
    expect(await ask(cached)).toEqual({ products: [1] });
    expect(calls).toHaveLength(1);
  });

  it("asks again once a minute has passed", async () => {
    clearCatalogueCache();
    const { calls, fetchLike } = counting();
    let now = 0;
    const cached = cachedFetch(fetchLike, () => now);
    await ask(cached);
    now = 61_000;
    expect(await ask(cached)).toEqual({ products: [2] });
    expect(calls).toHaveLength(2);
  });

  it("keeps a different request apart from this one", async () => {
    clearCatalogueCache();
    const { calls, fetchLike } = counting();
    const cached = cachedFetch(fetchLike, () => 0);
    await ask(cached, "{\"a\":1}");
    await ask(cached, "{\"a\":2}");
    expect(calls).toHaveLength(2);
  });

  it("never remembers a failure", async () => {
    clearCatalogueCache();
    const { calls, fetchLike } = counting(500);
    const cached = cachedFetch(fetchLike, () => 0);
    await cached("https://wix/search", { method: "POST", body: "{}" });
    await cached("https://wix/search", { method: "POST", body: "{}" });
    expect(calls).toHaveLength(2);
  });
});
