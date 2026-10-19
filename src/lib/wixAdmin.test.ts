import { describe, expect, it } from "vitest";
import { adminConfigured, createAdminFetch } from "@/lib/wixAdmin";

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

  it("ignores spaces and a stray new line around the id and secret, which a paste can add", async () => {
    const calls: Call[] = [];
    const admin = createAdminFetch({
      clientId: " client-id ",
      clientSecret: "  the-secret\n",
      fetchImpl: async (url, init) => {
        calls.push({ url, init });
        return new Response(JSON.stringify({ access_token: "t", expires_in: 14400 }), { status: 200 });
      },
    });
    await admin("/a", {});
    expect(JSON.parse(String(calls[0].init?.body))).toMatchObject({ client_id: "client-id", client_secret: "the-secret" });
  });

  it("treats a secret that is only spaces as missing", async () => {
    const { admin, calls } = setup({ secret: "   \n" });
    await expect(admin("/a", {})).rejects.toThrow(/not set up/i);
    expect(calls).toHaveLength(0);
  });

  it("reports why Wix refused the token, without the secret", async () => {
    const admin = createAdminFetch({
      clientId: "client-id",
      clientSecret: "the-secret",
      fetchImpl: async () =>
        new Response(JSON.stringify({ error: "invalid_client", error_description: "Invalid client credentials" }), { status: 400 }),
    });
    const error = await admin("/a", {}).catch((e: Error) => e);
    expect((error as Error).message).toMatch(/400/);
    expect((error as Error).message).toMatch(/invalid_client/);
    expect((error as Error).message).not.toContain("the-secret");
  });

  it("does not ask Wix again for 30 seconds after a refusal, so a wrong secret cannot flood Wix", async () => {
    const clock = { t: 1_000_000 };
    let asked = 0;
    const admin = createAdminFetch({
      clientId: "client-id",
      clientSecret: "wrong",
      now: () => clock.t,
      fetchImpl: async () => {
        asked++;
        return new Response(JSON.stringify({ error: "invalid_client" }), { status: 400 });
      },
    });
    await expect(admin("/a", {})).rejects.toThrow(/invalid_client/);
    await expect(admin("/b", {})).rejects.toThrow(/invalid_client/);
    expect(asked).toBe(1);
    clock.t += 31_000;
    await expect(admin("/c", {})).rejects.toThrow(/invalid_client/);
    expect(asked).toBe(2);
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

  it("tries again at once after a Wix outage, since only a refusal is remembered", async () => {
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

describe("adminConfigured", () => {
  const keep = { id: process.env.NEXT_PUBLIC_WIX_CLIENT_ID, secret: process.env.WIX_CLIENT_SECRET };
  const restore = () => {
    for (const [name, value] of [["NEXT_PUBLIC_WIX_CLIENT_ID", keep.id], ["WIX_CLIENT_SECRET", keep.secret]] as const) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  };

  it("is on when both values are there, even with spaces round them", () => {
    process.env.NEXT_PUBLIC_WIX_CLIENT_ID = " id ";
    process.env.WIX_CLIENT_SECRET = "secret\n";
    expect(adminConfigured()).toBe(true);
    restore();
  });

  it("is off when the secret is missing or only spaces", () => {
    process.env.NEXT_PUBLIC_WIX_CLIENT_ID = "id";
    process.env.WIX_CLIENT_SECRET = "  \n";
    expect(adminConfigured()).toBe(false);
    delete process.env.WIX_CLIENT_SECRET;
    expect(adminConfigured()).toBe(false);
    restore();
  });
});
