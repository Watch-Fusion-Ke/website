import { describe, expect, it } from "vitest";
import { redirectLoginAvailable } from "@/lib/loginCheck";

type Step = { url: string; init?: RequestInit };

// A pretend Wix: the token answer, the sign-in address, and what that address does.
const wix = (authorizeStatus: number, over: { tokenStatus?: number; sessionStatus?: number } = {}) => {
  const steps: Step[] = [];
  const fetchImpl = async (url: string, init?: RequestInit) => {
    steps.push({ url, init });
    if (url.endsWith("/oauth2/token")) {
      return new Response(JSON.stringify({ access_token: "visitor-token" }), { status: over.tokenStatus ?? 200 });
    }
    if (url.endsWith("/redirect-session")) {
      return new Response(JSON.stringify({ redirectSession: { fullUrl: "https://store.example/_api/oauth2/authorize?x=1" } }), {
        status: over.sessionStatus ?? 200,
      });
    }
    return new Response(null, { status: authorizeStatus });
  };
  return { fetchImpl, steps };
};

const check = (fetchImpl: (url: string, init?: RequestInit) => Promise<Response>) =>
  redirectLoginAvailable({ origin: "https://shop.example", clientId: "client-1", fetchImpl });

describe("redirectLoginAvailable", () => {
  it("is true when Wix sends a visitor on to its login for this address", async () => {
    expect(await check(wix(302).fetchImpl)).toBe(true);
  });

  it("is false when Wix refuses the address, as it does before the address is on the allowed list", async () => {
    expect(await check(wix(400).fetchImpl)).toBe(false);
  });

  it("asks for the sign-in address for this site's callback, with a visitor and no member session", async () => {
    const { fetchImpl, steps } = wix(302);
    await check(fetchImpl);
    const session = steps.find((s) => s.url.endsWith("/redirect-session"))!;
    const body = JSON.parse(String(session.init?.body));
    expect(body.auth.authRequest.redirectUri).toBe("https://shop.example/login/callback");
    expect(body.auth.authRequest.clientId).toBe("client-1");
    expect(body.auth.authRequest).not.toHaveProperty("sessionToken");
    expect((session.init?.headers as Record<string, string>).authorization).toBe("visitor-token");
  });

  it("looks at the answer without following it", async () => {
    const { fetchImpl, steps } = wix(302);
    await check(fetchImpl);
    expect(steps[steps.length - 1].init?.redirect).toBe("manual");
  });

  it("is false when any step fails or Wix cannot be reached", async () => {
    expect(await check(wix(302, { tokenStatus: 500 }).fetchImpl)).toBe(false);
    expect(await check(wix(302, { sessionStatus: 403 }).fetchImpl)).toBe(false);
    expect(
      await check(async () => {
        throw new Error("network");
      })
    ).toBe(false);
  });
});
