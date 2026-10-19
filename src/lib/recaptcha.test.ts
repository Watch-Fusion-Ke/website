import { beforeEach, describe, expect, it } from "vitest";
import { loadRecaptcha, resetRecaptchaForTests } from "@/lib/recaptcha";

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
