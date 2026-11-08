import { beforeEach, describe, expect, it, vi } from "vitest";

const wix = vi.hoisted(() => ({ calls: 0, fail: false }));
vi.mock("@wix/sdk", () => ({
  OAuthStrategy: () => ({}),
  createClient: () => ({
    auth: {
      generateVisitorTokens: async () => {
        wix.calls++;
        if (wix.fail) throw new Error("wix down");
        return { refreshToken: { value: "visitor-token" } };
      },
    },
  }),
}));

import { NextRequest } from "next/server";
import { config, middleware } from "@/middleware";

const at = (path: string, cookie?: string) => new NextRequest(`https://shop.test${path}`, cookie ? { headers: { cookie } } : undefined);

beforeEach(() => {
  wix.calls = 0;
  wix.fail = false;
});

describe("which requests the visitor check runs on", () => {
  const runsOn = (path: string) => config.matcher.some((m) => new RegExp(`^${m}$`).test(path));

  it("runs on every page and on the shop's own data routes, which need the visitor's session", () => {
    for (const path of ["/", "/shop", "/shop/casio-watches-kenya", "/cart", "/gift-vouchers", "/api/search", "/api/delivery", "/naviforce-nf9269-blue-leather-watch"]) {
      expect(runsOn(path), path).toBe(true);
    }
  });

  it("does not run on the site's files and pictures, which never need a session and are fetched by link previews and crawlers", () => {
    for (const path of ["/_next/static/chunks/main.js", "/_next/image", "/share-image.png", "/logo.png", "/favicon.ico", "/robots.txt", "/sitemap.xml", "/products/a.jpg", "/fonts/x.woff2"]) {
      expect(runsOn(path), path).toBe(false);
    }
  });
});

describe("the visitor check", () => {
  it("leaves a visitor who already has a session alone, without asking Wix", async () => {
    const res = await middleware(at("/shop", "refreshToken=abc"));
    expect(wix.calls).toBe(0);
    expect(res.cookies.get("refreshToken")).toBeUndefined();
  });

  it("gives a new visitor a session that lasts thirty days", async () => {
    const res = await middleware(at("/shop"));
    expect(wix.calls).toBe(1);
    const cookie = res.cookies.get("refreshToken");
    expect(cookie?.value).toBe(JSON.stringify({ value: "visitor-token" }));
    expect(cookie?.maxAge).toBe(60 * 60 * 24 * 30);
  });

  it("still serves the page, without a session, when Wix cannot be reached, instead of failing the whole page", async () => {
    wix.fail = true;
    const res = await middleware(at("/shop"));
    expect(res.status).toBe(200);
    expect(res.cookies.get("refreshToken")).toBeUndefined();
  });
});
