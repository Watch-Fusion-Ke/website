import { describe, expect, it } from "vitest";
import { createAdminFetch } from "@/lib/wixAdmin";

type Call = { url: string; init?: RequestInit };
const setup = (opts: { secret?: string; clock?: { t: number } } = {}) => {
  const calls: Call[] = [];
  let tokenCount = 0;
  const fetchImpl = async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (url.endsWith("/oauth2/token")) {
      tokenCount++;
      return new Response(JSON.stringify({ access_token: `token-${tokenCount}`, expires_in: 14400 }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  const clock = opts.clock ?? { t: 1_000_000 };
  const admin = createAdminFetch({
    clientId: "client-id",
    clientSecret: "secret" in opts ? opts.secret : "the-secret",
    fetchImpl,
    now: () => clock.t,
  });
  return { admin, calls, clock };
};

describe("createAdminFetch", () => {
  it("asks Wix for a token with the client credentials, once, and sends it on the call", async () => {
    const { admin, calls } = setup();
    await admin("/ecom/v2/carts/c1", { method: "GET" });
    const tokenCall = calls[0];
    expect(tokenCall.url).toBe("https://www.wixapis.com/oauth2/token");
    expect(JSON.parse(String(tokenCall.init?.body))).toEqual({
      grant_type: "client_credentials",
      client_id: "client-id",
      client_secret: "the-secret",
    });
    expect(calls[1].url).toBe("https://www.wixapis.com/ecom/v2/carts/c1");
    expect((calls[1].init?.headers as Record<string, string>).Authorization).toBe("token-1");
  });

  it("reuses the token until shortly before it expires, then asks for a new one", async () => {
    const { admin, calls, clock } = setup();
    await admin("/a", {});
    await admin("/b", {});
    expect(calls.filter((c) => c.url.endsWith("/oauth2/token"))).toHaveLength(1);
    clock.t += 14400 * 1000 - 30_000;
    await admin("/c", {});
    expect(calls.filter((c) => c.url.endsWith("/oauth2/token"))).toHaveLength(2);
  });

  it("shares one token request between calls made at the same moment", async () => {
    const { admin, calls } = setup();
    await Promise.all([admin("/a", {}), admin("/b", {}), admin("/c", {})]);
    expect(calls.filter((c) => c.url.endsWith("/oauth2/token"))).toHaveLength(1);
  });

  it("says it is not set up when the secret is missing, without calling Wix", async () => {
    const { admin, calls } = setup({ secret: undefined });
    await expect(admin("/a", {})).rejects.toThrow(/not set up/i);
    expect(calls).toHaveLength(0);
  });

  it("never puts the secret in an error message", async () => {
    const calls: string[] = [];
    const admin = createAdminFetch({
      clientId: "id",
      clientSecret: "TOP-SECRET-VALUE",
      fetchImpl: async (url) => {
        calls.push(url);
        return new Response(JSON.stringify({ message: "denied" }), { status: 401 });
      },
      now: () => 1,
    });
    await expect(admin("/a", {})).rejects.toThrow();
    await admin("/a", {}).catch((e: Error) => expect(e.message).not.toContain("TOP-SECRET-VALUE"));
  });

  it("tries again for a token after a failure instead of remembering the failure", async () => {
    let n = 0;
    const admin = createAdminFetch({
      clientId: "id",
      clientSecret: "s",
      fetchImpl: async (url) => {
        if (url.endsWith("/oauth2/token")) {
          n++;
          return n === 1
            ? new Response("{}", { status: 500 })
            : new Response(JSON.stringify({ access_token: "ok", expires_in: 100 }), { status: 200 });
        }
        return new Response("{}", { status: 200 });
      },
      now: () => 1,
    });
    await expect(admin("/a", {})).rejects.toThrow();
    await expect(admin("/a", {})).resolves.toBeInstanceOf(Response);
  });
});
