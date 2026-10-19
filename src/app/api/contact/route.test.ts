import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  configured: true,
  posts: [] as unknown[],
}));

vi.mock("@/lib/wixAdmin", () => ({
  adminConfigured: () => state.configured,
  adminFetch: async (path: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    if (method === "POST") {
      state.posts.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify({ submission: { id: "s" } }), { status: 200 });
    }
    if (path.includes("formIds=")) {
      return new Response(
        JSON.stringify({
          forms: [
            {
              id: "f1",
              name: "Contact form",
              formFields: [
                { identifier: "CONTACTS_FIRST_NAME", inputOptions: { target: "n" } },
                { identifier: "CONTACTS_EMAIL", inputOptions: { target: "e" } },
                { identifier: "TEXT_AREA", inputOptions: { target: "m" } },
              ],
            },
          ],
        }),
        { status: 200 }
      );
    }
    return new Response(JSON.stringify({ forms: [{ id: "f1", name: "Contact form" }] }), { status: 200 });
  },
}));

import { POST } from "@/app/api/contact/route";

const body = { name: "Jane Wanjiru", email: "jane@example.com", message: "Is the green dial watch in stock?", website: "" };
let ip = 0;
const req = (data: unknown, headers: Record<string, string> = {}, raw?: string) =>
  new Request("https://www.watchfusionkenya.com/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${++ip}`, ...headers },
    body: raw ?? JSON.stringify(data),
  });

describe("POST /api/contact", () => {
  beforeEach(() => {
    state.configured = true;
    state.posts = [];
  });

  it("sends a good message and says so", async () => {
    const res = await POST(req(body));
    expect(res.status).toBe(200);
    expect(state.posts).toHaveLength(1);
  });

  it("refuses a request that comes from another website", async () => {
    const res = await POST(req(body, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
    expect(state.posts).toHaveLength(0);
  });

  it("accepts a request from the shop's own address", async () => {
    const res = await POST(req(body, { origin: "https://www.watchfusionkenya.com" }));
    expect(res.status).toBe(200);
  });

  it("answers a body that is not JSON with a plain request to check the boxes", async () => {
    const res = await POST(req(undefined, {}, "{not json"));
    expect(res.status).toBe(400);
  });

  it("says the form is not available when the shop's Wix access is not set up", async () => {
    state.configured = false;
    const res = await POST(req(body));
    expect(res.status).toBe(503);
    expect(state.posts).toHaveLength(0);
  });

  it("limits how many messages one visitor can send in a minute", async () => {
    const sameVisitor = { "x-forwarded-for": "203.0.113.9" };
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) statuses.push((await POST(req(body, sameVisitor))).status);
    expect(statuses.slice(0, 5).every((s) => s === 200)).toBe(true);
    expect(statuses.slice(5)).toEqual([429, 429]);
  });
});
