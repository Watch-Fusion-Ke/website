import { describe, expect, it } from "vitest";
import {
  CALLBACK_PATH,
  beginRedirectLogin,
  callbackUrl,
  finishRedirectLogin,
  readCallback,
  safeReturnPath,
  type LoginStorage,
} from "@/lib/loginRedirect";

const memoryStorage = (): LoginStorage & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
};

const oauthData = { codeVerifier: "v", codeChallenge: "c", state: "s1", redirectUri: "https://shop.example/login/callback", originalUri: "/cart" };

describe("callbackUrl", () => {
  it("is the shop's own address plus the callback path", () => {
    expect(CALLBACK_PATH).toBe("/login/callback");
    expect(callbackUrl("https://www.watchfusionkenya.com")).toBe("https://www.watchfusionkenya.com/login/callback");
  });
});

describe("safeReturnPath", () => {
  it("keeps a path on this site and refuses anything that could leave it", () => {
    expect(safeReturnPath("/cart")).toBe("/cart");
    expect(safeReturnPath("/shop?cat=gents")).toBe("/shop?cat=gents");
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", undefined, "cart"]) {
      expect(safeReturnPath(bad)).toBe("/");
    }
  });

  it("refuses a tab, new line or other control character, which browsers delete and so turn /<tab>/evil.example into evil.example", () => {
    for (const bad of ["/\t/evil.example", "/\n/evil.example", "/\r/evil.example", "/\u0000/evil.example", "/\u007f/x", "/ok\n"]) {
      expect(safeReturnPath(bad)).toBe("/");
    }
  });

  it("never gives back a path that leaves the site once a browser has read it", () => {
    const tricky = ["/%09/evil.example", "/%2F/evil.example", "/.//evil.example", "/..//evil.example", "/%5Cevil.example", "////evil.example", "/;@evil.example"];
    for (const input of tricky) {
      const path = safeReturnPath(input);
      expect(new URL(path, "https://shop.example").origin).toBe("https://shop.example");
    }
  });
});

describe("readCallback", () => {
  it("reads the code and state Wix sends back in the address", () => {
    expect(readCallback("https://x/login/callback?code=abc&state=s1")).toEqual({ code: "abc", state: "s1" });
  });

  it("reads an error Wix sends back instead", () => {
    expect(readCallback("https://x/login/callback?error=access_denied&error_description=No&state=s1")).toMatchObject({
      error: "access_denied",
      errorDescription: "No",
    });
  });

  it("copes with nothing in the address", () => {
    expect(readCallback("https://x/login/callback")).toEqual({});
  });
});

describe("beginRedirectLogin", () => {
  const deps = (over: Record<string, unknown> = {}) => {
    const storage = memoryStorage();
    const navigated: string[] = [];
    const calls: unknown[] = [];
    return {
      storage,
      navigated,
      calls,
      args: {
        origin: "https://shop.example",
        returnTo: "/cart",
        sessionToken: "session-1",
        storage,
        now: () => 1000,
        generateOAuthData: (redirectUri: string, originalUri?: string) => ({ ...oauthData, redirectUri, originalUri: originalUri ?? "" }),
        getAuthUrl: async (data: unknown, opts: unknown) => {
          calls.push({ data, opts });
          return { authUrl: "https://store.example/_api/oauth2/authorize?x=1" };
        },
        navigate: (url: string) => void navigated.push(url),
        ...over,
      },
    };
  };

  it("keeps the sign-in data, asks Wix for the sign-in address with the session, and goes there", async () => {
    const d = deps();
    const result = await beginRedirectLogin(d.args as never);
    expect(result).toBe("redirected");
    expect(d.navigated).toEqual(["https://store.example/_api/oauth2/authorize?x=1"]);
    const call = d.calls[0] as { data: { redirectUri: string; originalUri: string }; opts: Record<string, unknown> };
    expect(call.data.redirectUri).toBe("https://shop.example/login/callback");
    expect(call.data.originalUri).toBe("/cart");
    expect(call.opts).toMatchObject({ responseMode: "query", prompt: "none", sessionToken: "session-1" });
    expect(d.storage.data.size).toBe(1);
  });

  it("says it could not, and keeps nothing, when Wix will not give a sign-in address", async () => {
    const d = deps({
      getAuthUrl: async () => {
        throw new Error("redirect uri not allowed");
      },
    });
    expect(await beginRedirectLogin(d.args as never)).toBe("unavailable");
    expect(d.navigated).toEqual([]);
    expect(d.storage.data.size).toBe(0);
  });
});

describe("finishRedirectLogin", () => {
  const setup = (over: Record<string, unknown> = {}, savedAt = 1000) => {
    const storage = memoryStorage();
    storage.setItem("wf-login-oauth", JSON.stringify({ savedAt, data: oauthData }));
    const log: string[] = [];
    const args = {
      href: "https://shop.example/login/callback?code=abc&state=s1",
      storage,
      now: () => 2000,
      getMemberTokens: async (code: string, state: string) => {
        log.push(`tokens ${code} ${state}`);
        return { accessToken: { value: "a", expiresAt: 9 }, refreshToken: { value: "r", role: "member" } };
      },
      setTokens: () => void log.push("set"),
      saveRefreshToken: () => void log.push("cookie"),
      navigate: (url: string) => void log.push(`go ${url}`),
      ...over,
    };
    return { args, storage, log };
  };

  it("swaps the code for member tokens, remembers them, and returns the shopper to where they were", async () => {
    const { args, storage, log } = setup();
    expect(await finishRedirectLogin(args as never)).toEqual({ ok: true });
    expect(log).toEqual(["tokens abc s1", "set", "cookie", "go /cart"]);
    expect(storage.data.size).toBe(0);
  });

  it("never sends the shopper off the site, whatever was saved as the return address", async () => {
    const { args, storage, log } = setup();
    storage.setItem("wf-login-oauth", JSON.stringify({ savedAt: 1000, data: { ...oauthData, originalUri: "https://evil.example" } }));
    await finishRedirectLogin(args as never);
    expect(log[log.length - 1]).toBe("go /");
  });

  it("explains an error Wix sent back, and does not try to swap anything", async () => {
    const { args, log } = setup({ href: "https://shop.example/login/callback?error=access_denied&state=s1" });
    const result = await finishRedirectLogin(args as never);
    expect(result).toMatchObject({ ok: false });
    expect((result as { message: string }).message).toMatch(/log in again/i);
    expect(log).toEqual([]);
  });

  it("asks the shopper to log in again when the saved data is missing, so a link opened elsewhere cannot work", async () => {
    const { args, storage } = setup();
    storage.data.clear();
    const result = await finishRedirectLogin(args as never);
    expect(result).toMatchObject({ ok: false });
    expect((result as { message: string }).message).toMatch(/log in again/i);
  });

  it("treats saved data older than 15 minutes as missing", async () => {
    const { args } = setup({ now: () => 1000 + 16 * 60 * 1000 });
    expect(await finishRedirectLogin(args as never)).toMatchObject({ ok: false });
  });

  it("treats damaged saved data as missing", async () => {
    const { args, storage } = setup();
    storage.setItem("wf-login-oauth", "{not json");
    expect(await finishRedirectLogin(args as never)).toMatchObject({ ok: false });
    expect(storage.data.size).toBe(0);
  });

  it("gives a plain message when the swap fails", async () => {
    const { args, log } = setup({
      getMemberTokens: async () => {
        throw new Error("Invalid _state");
      },
    });
    const result = await finishRedirectLogin(args as never);
    expect(result).toMatchObject({ ok: false });
    expect((result as { message: string }).message).not.toMatch(/Invalid _state/);
    expect(log).toEqual([]);
  });

  it("uses a saved sign-in only once", async () => {
    const { args } = setup();
    await finishRedirectLogin(args as never);
    expect(await finishRedirectLogin(args as never)).toMatchObject({ ok: false });
  });
});
