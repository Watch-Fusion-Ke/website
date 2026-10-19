// Finds out, before anyone logs in, whether Wix will accept this site's /login/callback as a place to send members back to.
// Wix does not say so when it makes the sign-in address; it refuses (400) only when the visitor arrives. A visitor session
// is used, so no member is involved. If this says no, the login uses the older method that needs no extra address.
import { callbackUrl } from "@/lib/loginRedirect";

const API = "https://www.wixapis.com";

export const redirectLoginAvailable = async (deps: {
  origin: string;
  clientId: string;
  refreshToken?: string;
  fetchImpl?: (url: string, init?: RequestInit) => Promise<Response>;
}): Promise<boolean> => {
  const call = deps.fetchImpl ?? fetch;
  try {
    const tokenResponse = await call(`${API}/oauth2/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        deps.refreshToken
          ? { clientId: deps.clientId, grantType: "refresh_token", refreshToken: deps.refreshToken }
          : { clientId: deps.clientId, grantType: "anonymous" }
      ),
    });
    if (!tokenResponse.ok) return false;
    const token = (await tokenResponse.json())?.access_token;
    if (!token) return false;

    const session = await call(`${API}/_api/redirects-api/v1/redirect-session`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: token },
      body: JSON.stringify({
        auth: {
          authRequest: {
            clientId: deps.clientId,
            redirectUri: callbackUrl(deps.origin),
            codeChallenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
            codeChallengeMethod: "S256",
            responseMode: "query",
            responseType: "code",
            scope: "offline_access",
            state: "address-check",
          },
          prompt: "none",
        },
      }),
    });
    if (!session.ok) return false;
    const fullUrl = (await session.json())?.redirectSession?.fullUrl;
    if (!fullUrl) return false;

    const arrival = await call(fullUrl, { redirect: "manual" });
    return arrival.status >= 300 && arrival.status < 400;
  } catch {
    return false;
  }
};
