import { interpretAuth, type AuthMode, type AuthOutcome } from "@/lib/auth";

// How a sign-up or login gets past Wix's robot check. Wix has two kinds: a silent one (only suspicious visitors are
// stopped) and a visible box (everyone ticks it). The site's setting is not told to the page, so the silent check is
// tried first, and the box is shown only if Wix will not take it.
// Docs: https://dev.wix.com/docs/go-headless/authentication/members/custom-login-page/re-captcha/about-re-captcha

export type CaptchaKind = "invisible" | "visible";
type Tokens = { recaptchaToken?: string; invisibleRecaptchaToken?: string } | undefined;
type WixAnswer = { loginState?: unknown; errorCode?: string } | undefined;

export const signInWithCaptcha = async (deps: {
  mode: AuthMode;
  send: (tokens: Tokens) => Promise<WixAnswer>;
  getInvisibleToken: () => Promise<string>;
  remembered?: CaptchaKind | null;
  visibleToken?: string;
}): Promise<{ response: WixAnswer; outcome: AuthOutcome; learned: CaptchaKind | null }> => {
  const settle = async (tokens: Tokens) => {
    const response = await deps.send(tokens);
    return { response, outcome: interpretAuth(response, deps.mode) };
  };
  const needsBox = (): { response: WixAnswer; outcome: AuthOutcome; learned: CaptchaKind } => ({
    response: undefined,
    outcome: { kind: "captcha", message: "Please tick the box to show you are not a robot, then press the button again." },
    learned: "visible",
  });

  // The ticked box
  if (deps.visibleToken) {
    return { ...(await settle({ recaptchaToken: deps.visibleToken })), learned: "visible" };
  }

  // The silent check already worked in this visit: get it first, so there is no failed attempt
  if (deps.remembered === "invisible") {
    let token: string;
    try {
      token = await deps.getInvisibleToken();
    } catch {
      return needsBox();
    }
    const result = await settle({ invisibleRecaptchaToken: token });
    return { ...result, learned: result.outcome.kind === "captcha" ? "visible" : "invisible" };
  }

  const first = await settle(undefined);
  if (first.outcome.kind !== "captcha") return { ...first, learned: null };

  let token: string;
  try {
    token = await deps.getInvisibleToken();
  } catch {
    return { ...first, learned: "visible" };
  }
  const second = await settle({ invisibleRecaptchaToken: token });
  return { ...second, learned: second.outcome.kind === "captcha" ? "visible" : "invisible" };
};
