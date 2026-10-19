"use client";

import { useEffect, useRef } from "react";
import { loadRecaptcha } from "@/lib/recaptcha";

// The "I am not a robot" box. `resetKey` draws a fresh one, since each answer can be used only once.
const CaptchaBox = ({
  siteKey,
  resetKey,
  onToken,
  onExpired,
  onFailed,
}: {
  siteKey: string;
  resetKey: number;
  onToken: (token: string) => void;
  onExpired: () => void;
  onFailed: () => void;
}) => {
  const box = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onToken, onExpired, onFailed });
  handlers.current = { onToken, onExpired, onFailed };

  useEffect(() => {
    let cancelled = false;
    loadRecaptcha()
      .then((recaptcha) => {
        if (cancelled || !box.current) return;
        box.current.innerHTML = "";
        recaptcha.render(box.current, {
          sitekey: siteKey,
          // the normal box is 304 px wide, which does not fit the narrowest phones
          size: window.innerWidth < 360 ? "compact" : "normal",
          theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
          callback: (token) => handlers.current.onToken(token),
          "expired-callback": () => handlers.current.onExpired(),
          "error-callback": () => handlers.current.onFailed(),
        });
      })
      .catch(() => {
        if (!cancelled) handlers.current.onFailed();
      });
    return () => {
      cancelled = true;
    };
  }, [siteKey, resetKey]);

  return <div ref={box} data-captcha-box role="group" aria-label="Robot check" className="min-h-[78px]" />;
};

export default CaptchaBox;
