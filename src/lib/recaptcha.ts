// Loads Google's reCAPTCHA Enterprise script, which Wix's member sign-up and login use for the robot check.
// Docs: https://dev.wix.com/docs/go-headless/authentication/members/custom-login-page/re-captcha/add-re-captcha-to-a-custom-login-page-js-sdk
// The key shown must be Wix's own (wixClient.auth.captchaVisibleSiteKey), never one of ours.

export type RecaptchaApi = {
  render: (
    el: HTMLElement,
    options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void }
  ) => number;
  reset: (id?: number) => void;
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

export const loadRecaptcha = (env?: Env): Promise<RecaptchaApi> => {
  const { window: win, document: doc } = env ?? { window: window as unknown as Record<string, unknown>, document };
  const present = apiOf(win);
  if (present?.render) return Promise.resolve(present);
  if (loading) return loading;

  loading = new Promise<RecaptchaApi>((resolve, reject) => {
    win[READY] = () => {
      delete win[READY];
      const api = apiOf(win);
      const ready = (win.grecaptcha as { enterprise?: { ready?: (fn: () => void) => void } } | undefined)?.enterprise?.ready;
      if (!api) return reject(new Error("recaptcha did not start"));
      if (typeof ready === "function") ready(() => resolve(api));
      else resolve(api);
    };
    const script = doc.createElement("script");
    script.src = `${SRC}?render=explicit&onload=${READY}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      loading = null; // a later attempt may load it again
      reject(new Error("recaptcha script failed to load"));
    };
    doc.head.appendChild(script);
  });
  return loading;
};
