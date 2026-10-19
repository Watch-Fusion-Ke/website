import { beforeEach, describe, expect, it } from "vitest";
import { getInvisibleToken, loadRecaptcha, resetRecaptchaForTests } from "@/lib/recaptcha";

// A tiny pretend browser: a page that collects script tags, and a window Google's script would fill in.
const pretend = () => {
  const scripts: { src: string; onerror?: () => void }[] = [];
  const win: Record<string, unknown> = {};
  const doc = {
    createElement: () => ({}) as { src: string; async?: boolean; defer?: boolean; onerror?: () => void },
    head: { appendChild: (el: { src: string; onerror?: () => void }) => void scripts.push(el) },
  };
  const googleLoads = () => {
    win.grecaptcha = { enterprise: { render: () => 1, reset: () => {}, ready: (fn: () => void) => fn() } };
    const callback = new URL(scripts[0].src).searchParams.get("onload")!;
    (win[callback] as () => void)();
  };
  return { env: { window: win, document: doc } as never, scripts, win, googleLoads };
};

describe("loadRecaptcha", () => {
  beforeEach(() => resetRecaptchaForTests());

  it("loads Google's reCAPTCHA Enterprise script once and hands back its API when it is ready", async () => {
    const p = pretend();
    const first = loadRecaptcha(p.env);
    const second = loadRecaptcha(p.env);
    expect(p.scripts).toHaveLength(1);
    const src = new URL(p.scripts[0].src);
    expect(src.origin + src.pathname).toBe("https://www.google.com/recaptcha/enterprise.js");
    expect(src.searchParams.get("render")).toBe("explicit");
    p.googleLoads();
    const api = await first;
    expect(typeof api.render).toBe("function");
    expect(await second).toBe(api);
  });

  it("uses what is already on the page without loading again", async () => {
    const p = pretend();
    p.win.grecaptcha = { enterprise: { render: () => 1, reset: () => {}, ready: (fn: () => void) => fn() } };
    await loadRecaptcha(p.env);
    expect(p.scripts).toHaveLength(0);
  });

  it("fails when the script cannot load, and tries again on the next call", async () => {
    const p = pretend();
    const failed = loadRecaptcha(p.env);
    p.scripts[0].onerror!();
    await expect(failed).rejects.toThrow(/recaptcha/i);
    const again = loadRecaptcha(p.env);
    expect(p.scripts).toHaveLength(2);
    void again.catch(() => {});
  });
});

describe("loadRecaptcha timing", () => {
  beforeEach(() => resetRecaptchaForTests());

  it("gives up with a clear error if the script never answers, and can be tried again", async () => {
    const p = pretend();
    const slow = loadRecaptcha(p.env, 20);
    await expect(slow).rejects.toThrow(/did not load in time/i);
    const again = loadRecaptcha(p.env, 20);
    expect(p.scripts).toHaveLength(2);
    void again.catch(() => {});
  });

  it("forgets a start that found no reCAPTCHA, so the next call tries again", async () => {
    const p = pretend();
    const first = loadRecaptcha(p.env);
    (p.win[new URL(p.scripts[0].src).searchParams.get("onload")!] as () => void)();
    await expect(first).rejects.toThrow();
    void loadRecaptcha(p.env).catch(() => {});
    expect(p.scripts).toHaveLength(2);
  });
});

describe("getInvisibleToken", () => {
  beforeEach(() => resetRecaptchaForTests());

  const withWidget = (behave: (opts: { callback: (t: string) => void; "error-callback": () => void }) => void) => {
    const p = pretend();
    const added: unknown[] = [];
    const doc = p.env as unknown as { document: { createElement: () => unknown; body?: unknown; head: unknown } };
    doc.document.createElement = () => ({ style: {}, remove: () => {} });
    doc.document.body = { appendChild: (el: unknown) => void added.push(el) };
    p.win.grecaptcha = {
      enterprise: {
        render: (_el: unknown, opts: { size?: string; sitekey: string; callback: (t: string) => void; "error-callback": () => void }) => {
          expect(opts.size).toBe("invisible");
          expect(opts.sitekey).toBe("wix-invisible-key");
          p.win.__opts = opts;
          return 7;
        },
        reset: () => {},
        execute: (id: number) => {
          expect(id).toBe(7);
          behave(p.win.__opts as never);
        },
        ready: (fn: () => void) => fn(),
      },
    };
    return p.env;
  };

  it("runs the silent check with Wix's invisible key and returns its token", async () => {
    const env = withWidget((o) => o.callback("token-xyz"));
    expect(await getInvisibleToken("wix-invisible-key", env)).toBe("token-xyz");
  });

  it("fails when the check reports an error", async () => {
    const env = withWidget((o) => o["error-callback"]());
    await expect(getInvisibleToken("wix-invisible-key", env)).rejects.toThrow(/robot check/i);
  });

  it("takes its holder off the page and resets its own widget when it is done", async () => {
    const removed: string[] = [];
    const resets: unknown[] = [];
    const p = pretend();
    const doc = p.env as unknown as { document: { createElement: () => unknown; body?: unknown } };
    doc.document.createElement = () => ({ style: {}, remove: () => void removed.push("holder") });
    doc.document.body = { appendChild: () => {} };
    p.win.grecaptcha = {
      enterprise: {
        render: (_el: unknown, o: { callback: (t: string) => void }) => {
          p.win.__cb = o.callback;
          return 7;
        },
        reset: (id?: number) => void resets.push(id),
        execute: () => (p.win.__cb as (t: string) => void)("tok"),
        ready: (fn: () => void) => fn(),
      },
    };
    await getInvisibleToken("k", p.env);
    expect(removed).toEqual(["holder"]);
    expect(resets).toEqual([7]);
  });

  it("does not reset anything when the widget could not even be drawn, since that would clear the box the shopper ticked", async () => {
    const resets: unknown[] = [];
    const p = pretend();
    const doc = p.env as unknown as { document: { createElement: () => unknown; body?: unknown } };
    doc.document.createElement = () => ({ style: {}, remove: () => {} });
    doc.document.body = { appendChild: () => {} };
    p.win.grecaptcha = {
      enterprise: {
        render: () => {
          throw new Error("cannot draw");
        },
        reset: (id?: number) => void resets.push(id),
        execute: () => {},
        ready: (fn: () => void) => fn(),
      },
    };
    await expect(getInvisibleToken("k", p.env)).rejects.toThrow();
    expect(resets).toEqual([]);
  });

  it("fails at once when Google's script cannot run a silent check, instead of waiting", async () => {
    const p = pretend();
    const doc = p.env as unknown as { document: { createElement: () => unknown; body?: unknown } };
    doc.document.createElement = () => ({ style: {}, remove: () => {} });
    doc.document.body = { appendChild: () => {} };
    p.win.grecaptcha = { enterprise: { render: () => 3, reset: () => {}, ready: (fn: () => void) => fn() } };
    const started = Date.now();
    await expect(getInvisibleToken("k", p.env, 5000)).rejects.toThrow(/robot check/i);
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it("fails rather than waiting for ever", async () => {
    const env = withWidget(() => {});
    await expect(getInvisibleToken("wix-invisible-key", env, 20)).rejects.toThrow(/robot check/i);
  });
});
