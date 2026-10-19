"use client";

import { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { useWixClient } from "@/hooks/useWixClient";
import { finishRedirectLogin } from "@/lib/loginRedirect";
import LoginCallbackView from "@/components/auth/LoginCallbackView";

// Wix sends the shopper back here after the email and password are accepted.
const LoginCallbackPage = () => {
  const wixClient = useWixClient();
  const [message, setMessage] = useState<string>();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // the saved sign-in can be used only once
    started.current = true;
    (async () => {
      let storage: Storage;
      try {
        storage = window.localStorage;
      } catch {
        setMessage("Your browser is blocking storage, so we could not finish logging you in. Please log in again.");
        return;
      }
      const result = await finishRedirectLogin({
        href: window.location.href,
        storage,
        now: Date.now,
        getMemberTokens: (code, state, data) => wixClient.auth.getMemberTokens(code, state, data as never) as Promise<never>,
        setTokens: (tokens) => wixClient.auth.setTokens(tokens as never),
        saveRefreshToken: (tokens) =>
          Cookies.set("refreshToken", JSON.stringify((tokens as { refreshToken: unknown }).refreshToken), {
            expires: 2,
            sameSite: "lax",
            secure: window.location.protocol === "https:",
          }),
        navigate: (path) => window.location.assign(path),
      });
      if (!result.ok) setMessage(result.message);
    })();
  }, [wixClient]);

  return <LoginCallbackView message={message} />;
};

export default LoginCallbackPage;
