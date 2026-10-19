"use client";

import { useEffect, useRef } from "react";
import { loadRecaptcha } from "@/lib/recaptcha";

// The "I am not a robot" box. Each answer can be used only once, so a fresh box is made by mounting this again
// with a new `key`. Google refuses to draw twice into the same element, so the box is never redrawn in place.
const CaptchaBox = ({
  siteKey,
  onToken,
  onExpired,
  onFailed,
}: {
  siteKey: string;
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
  }, [siteKey]);

  return <div ref={box} data-captcha-box role="group" aria-label="Robot check" className="min-h-[78px]" />;
};

export default CaptchaBox;
