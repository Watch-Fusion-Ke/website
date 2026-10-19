// Loads Google's reCAPTCHA Enterprise script, which Wix's member sign-up and login use for the robot check.
// Docs: https://dev.wix.com/docs/go-headless/authentication/members/custom-login-page/re-captcha/add-re-captcha-to-a-custom-login-page-js-sdk
// The key shown must be Wix's own (wixClient.auth.captchaVisibleSiteKey), never one of ours.

export type RecaptchaApi = {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      size?: "normal" | "compact" | "invisible";
      theme?: "light" | "dark";
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback": () => void;
    }
  ) => number;
  reset: (id?: number) => void;
  execute?: (id?: number) => void;
};

type Env = { window: Record<string, unknown>; document: Document };

const SRC = "https://www.google.com/recaptcha/enterprise.js";
const READY = "__wfRecaptchaReady";

let loading: Promise<RecaptchaApi> | null = null;

export const resetRecaptchaForTests = () => {
  loading = null;
};

const apiOf = (win: Record<string, unknown>): RecaptchaApi | undefined =>
  (win.grecaptcha as { enterprise?: RecaptchaApi } | undefined)?.enterprise;

// Google's script can stall without ever reporting an error, so loading is given a time limit.
export const loadRecaptcha = (env?: Env, timeoutMs = 15000): Promise<RecaptchaApi> => {
  const { window: win, document: doc } = env ?? { window: window as unknown as Record<string, unknown>, document };
  const present = apiOf(win);
  if (present?.render) return Promise.resolve(present);
  if (loading) return loading;

  loading = new Promise<RecaptchaApi>((resolve, reject) => {
    const fail = (message: string) => {
      loading = null; // a later attempt may load it again
      reject(new Error(message));
    };
    const timer = setTimeout(() => fail("recaptcha did not load in time"), timeoutMs);
    win[READY] = () => {
      delete win[READY];
      const api = apiOf(win);
      const ready = (win.grecaptcha as { enterprise?: { ready?: (fn: () => void) => void } } | undefined)?.enterprise?.ready;
      if (!api) {
        clearTimeout(timer);
        return fail("recaptcha did not start");
      }
      const done = () => {
        clearTimeout(timer);
        resolve(api);
      };
      if (typeof ready === "function") ready(done);
      else done();
    };
    const script = doc.createElement("script");
    script.src = `${SRC}?render=explicit&onload=${READY}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      clearTimeout(timer);
      fail("recaptcha script failed to load");
    };
    doc.head.appendChild(script);
  });
  return loading;
};

// The silent robot check: no box is shown. Wix's invisible key gives a token if Google trusts the visitor.
// The wait is kept short: a shopper on a blocked or slow network should reach the box quickly.
export const getInvisibleToken = async (siteKey: string, env?: Env, timeoutMs = 8000): Promise<string> => {
  const api = await loadRecaptcha(env, timeoutMs);
  if (typeof api.execute !== "function") throw new Error("The robot check cannot run silently here");
  const doc = env?.document ?? document;
  const holder = doc.createElement("div");
  doc.body.appendChild(holder);
  return new Promise<string>((resolve, reject) => {
    let id: number | undefined;
    const finish = (run: () => void) => {
      clearTimeout(timer);
      // Only this check's own widget is reset. With no id, Google would reset the first one on the page, the ticked box.
      if (id !== undefined) {
        try {
          api.reset(id);
        } catch {
          // the widget is already gone
        }
      }
      holder.remove();
      run();
    };
    const timer = setTimeout(() => finish(() => reject(new Error("The robot check timed out"))), timeoutMs);
    try {
      id = api.render(holder, {
        sitekey: siteKey,
        size: "invisible",
        callback: (token) => finish(() => resolve(token)),
        "error-callback": () => finish(() => reject(new Error("The robot check failed"))),
      });
      api.execute?.(id);
    } catch (error) {
      finish(() => reject(error));
    }
  });
};
