// Member login by full-page redirect. After the email and password are accepted, the shopper is sent to Wix to finish
// signing in and comes back to /login/callback with a code. Unlike the hidden-frame method, this works on any
// address and on phones that block third-party cookies.
// Docs: https://dev.wix.com/docs/go-headless/authentication/members/custom-login-page/build-a-custom-login-page-js-sdk
//       (Step 4, "Use a full-page redirect"). Each address used must be an allowed authorization redirect URI in Wix.

export const CALLBACK_PATH = "/login/callback";
const STORAGE_KEY = "wf-login-oauth";
const KEEP_FOR = 15 * 60 * 1000;

export type LoginStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

type OauthData = { codeVerifier: string; codeChallenge: string; state: string; redirectUri: string; originalUri: string };
type Tokens = { accessToken: unknown; refreshToken: unknown };

export const callbackUrl = (origin: string): string => `${origin}${CALLBACK_PATH}`;

// Only a path on this site is trusted as the place to return to. Browsers delete tabs and new lines inside an address,
// so "/<tab>/evil.example" would otherwise become "evil.example". Control characters are refused, and what is left is
// read the way a browser reads it, to be sure it stays on this site.
export const safeReturnPath = (path: string | undefined | null): string => {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/";
  if (/[\u0000-\u001f\u007f]/.test(path)) return "/";
  try {
    const base = "https://shop.invalid";
    const url = new URL(path, base);
    if (url.origin !== base || url.pathname.startsWith("//")) return "/";
    return url.pathname + url.search;
  } catch {
    return "/";
  }
};

export const readCallback = (href: string): { code?: string; state?: string; error?: string; errorDescription?: string } => {
  const params = new URL(href).searchParams;
  const result: { code?: string; state?: string; error?: string; errorDescription?: string } = {};
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");
  const errorDescription = params.get("error_description");
  if (code) result.code = code;
  if (state) result.state = state;
  if (error) result.error = error;
  if (errorDescription) result.errorDescription = errorDescription;
  return result;
};

export const beginRedirectLogin = async (deps: {
  origin: string;
  returnTo: string;
  sessionToken: string;
  storage: LoginStorage;
  now: () => number;
  generateOAuthData: (redirectUri: string, originalUri?: string) => OauthData;
  getAuthUrl: (data: OauthData, opts: Record<string, unknown>) => Promise<{ authUrl: string }>;
  navigate: (url: string) => void;
}): Promise<"redirected" | "unavailable"> => {
  const data = deps.generateOAuthData(callbackUrl(deps.origin), safeReturnPath(deps.returnTo));
  deps.storage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: deps.now(), data }));
  try {
    const { authUrl } = await deps.getAuthUrl(data, { responseMode: "query", prompt: "none", sessionToken: deps.sessionToken });
    deps.navigate(authUrl);
    return "redirected";
  } catch {
    deps.storage.removeItem(STORAGE_KEY);
    return "unavailable";
  }
};

const takeSaved = (storage: LoginStorage, now: () => number): OauthData | null => {
  const raw = storage.getItem(STORAGE_KEY);
  storage.removeItem(STORAGE_KEY); // a saved sign-in is used once
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw);
    if (!saved?.data || typeof saved.savedAt !== "number" || now() - saved.savedAt > KEEP_FOR) return null;
    return saved.data as OauthData;
  } catch {
    return null;
  }
};

const AGAIN = "We could not finish logging you in. Please log in again.";

export const finishRedirectLogin = async (deps: {
  href: string;
  storage: LoginStorage;
  now: () => number;
  getMemberTokens: (code: string, state: string, data: OauthData) => Promise<Tokens>;
  setTokens: (tokens: Tokens) => void;
  saveRefreshToken: (tokens: Tokens) => void;
  navigate: (path: string) => void;
}): Promise<{ ok: true } | { ok: false; message: string }> => {
  const saved = takeSaved(deps.storage, deps.now);
  const returned = readCallback(deps.href);
  if (returned.error || !returned.code || !returned.state || !saved) return { ok: false, message: AGAIN };
  try {
    const tokens = await deps.getMemberTokens(returned.code, returned.state, saved);
    deps.setTokens(tokens);
    deps.saveRefreshToken(tokens);
    deps.navigate(safeReturnPath(saved.originalUri));
    return { ok: true };
  } catch {
    return { ok: false, message: AGAIN };
  }
};
