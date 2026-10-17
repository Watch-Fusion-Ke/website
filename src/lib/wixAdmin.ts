// Calls to Wix made by the server with the shop's own admin identity (the OAuth client credentials grant).
// Docs: https://dev.wix.com/docs/go-headless/authentication/admin/make-admin-api-calls-with-client-credentials
// The secret is read from the server's environment only. It is never logged and never sent to the browser.

const TOKEN_URL = "https://www.wixapis.com/oauth2/token";
const API_BASE = "https://www.wixapis.com";
const EARLY = 60_000; // ask for a new token a minute before the old one expires

type Options = {
  clientId?: string;
  clientSecret?: string;
  fetchImpl?: (url: string, init?: RequestInit) => Promise<Response>;
  now?: () => number;
};

export type AdminFetch = (path: string, init?: RequestInit) => Promise<Response>;

export const createAdminFetch = ({ clientId, clientSecret, fetchImpl = fetch, now = Date.now }: Options): AdminFetch => {
  let token: { value: string; expiresAt: number } | null = null;
  let pending: Promise<string> | null = null;

  const getToken = async (): Promise<string> => {
    if (!clientId || !clientSecret) throw new Error("Wix admin access is not set up");
    if (token && now() < token.expiresAt - EARLY) return token.value;
    pending ??= (async () => {
      try {
        const response = await fetchImpl(TOKEN_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
        });
        if (!response.ok) throw new Error(`Wix admin token request failed (${response.status})`);
        const json = await response.json();
        if (!json?.access_token) throw new Error("Wix admin token request returned no token");
        token = { value: json.access_token, expiresAt: now() + Number(json.expires_in ?? 14400) * 1000 };
        return token.value;
      } finally {
        pending = null;
      }
    })();
    return pending;
  };

  return async (path, init = {}) => {
    const value = await getToken();
    return fetchImpl(`${API_BASE}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...(init.headers as Record<string, string>), Authorization: value },
    });
  };
};

// The server's admin fetch, built from the environment. Without the secret every call says it is not set up.
export const adminFetch: AdminFetch = createAdminFetch({
  clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID,
  clientSecret: process.env.WIX_CLIENT_SECRET,
});

export const adminConfigured = (): boolean => Boolean(process.env.NEXT_PUBLIC_WIX_CLIENT_ID && process.env.WIX_CLIENT_SECRET);
