"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { LoginState } from "@wix/sdk";
import { useWixClient } from "@/hooks/useWixClient";
import { interpretAuth, PASSWORD_HELP, signupProblem, type AuthMode } from "@/lib/auth";
import { beginRedirectLogin, safeReturnPath } from "@/lib/loginRedirect";
import PasswordField, { fieldClass, labelClass } from "@/components/auth/PasswordField";
import AuthShowcase, { type ShowcaseWatch } from "@/components/auth/AuthShowcase";

const TITLES: Record<AuthMode, string> = {
  LOGIN: "Log in",
  REGISTER: "Create an account",
  RESET_PASSWORD: "Reset your password",
  EMAIL_VERIFICATION: "Verify your email",
};

const INTRO: Record<AuthMode, string> = {
  LOGIN: "Welcome back. Log in to see your orders and check out faster.",
  REGISTER: "It takes a minute. You can then track your orders and check out faster.",
  RESET_PASSWORD: "Enter your email and we will send you a link to choose a new password.",
  EMAIL_VERIFICATION: "Enter the code we emailed you.",
};

const BUTTONS: Record<AuthMode, string> = {
  LOGIN: "Log in",
  REGISTER: "Create account",
  RESET_PASSWORD: "Send reset link",
  EMAIL_VERIFICATION: "Verify",
};

const link =
  "rounded text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold";

// Wix can leave this call hanging on phones that block third-party cookies, so it is given a time limit.
const withTimeout = <T,>(work: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });

const AuthForm = ({ initialMode = "LOGIN", watches }: { initialMode?: AuthMode; watches: ShowcaseWatch[] }) => {
  const wixClient = useWixClient();
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  // Whether Wix will take members back to this address. Until the check answers, the older method is used.
  const [redirectLogin, setRedirectLogin] = useState(false);

  useEffect(() => {
    if (wixClient.auth.loggedIn()) router.push("/");
  }, [wixClient, router]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/login-check")
      .then((r) => (r.ok ? r.json() : null))
      .then((answer) => {
        if (!cancelled && answer?.redirectLogin === true) setRedirectLogin(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // When the shopper switches forms the link they pressed disappears, so focus moves to the new heading.
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus();
  }, [mode]);

  const switchTo = (next: AuthMode) => {
    setMode(next);
    setError("");
    setMessage("");
    setPassword("");
  };

  // Sign-in is finished by sending the shopper to Wix and back, when Wix accepts this address (see /api/login-check).
  // Otherwise the older hidden-frame method is used, which works on the shop's own domain.
  const signedIn = async (sessionToken: string): Promise<void> => {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    if (storage && redirectLogin) {
      const outcome = await beginRedirectLogin({
        origin: window.location.origin,
        returnTo: safeReturnPath(new URLSearchParams(window.location.search).get("next")),
        sessionToken,
        storage,
        now: Date.now,
        generateOAuthData: (redirectUri, originalUri) => wixClient.auth.generateOAuthData(redirectUri, originalUri),
        getAuthUrl: (data, opts) => wixClient.auth.getAuthUrl(data, opts as never),
        navigate: (url) => window.location.assign(url),
      });
      if (outcome === "redirected") {
        setMessage("Taking you to finish signing in.");
        return;
      }
    }
    const tokens = await withTimeout(wixClient.auth.getMemberTokensForDirectLogin(sessionToken), 15000);
    Cookies.set("refreshToken", JSON.stringify(tokens.refreshToken), { expires: 2, sameSite: "lax", secure: window.location.protocol === "https:" });
    wixClient.auth.setTokens(tokens);
    setMessage("You are in. Taking you to the shop.");
    router.push(safeReturnPath(new URLSearchParams(window.location.search).get("next")));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (mode === "REGISTER") {
      const problem = signupProblem(password);
      if (problem) {
        setError(problem);
        return;
      }
    }
    setIsLoading(true);
    let leaving = false;

    try {
      if (mode === "RESET_PASSWORD") {
        await wixClient.auth.sendPasswordResetEmail(email, `${window.location.origin}/login`);
        setMessage("If that email has an account, a reset link is on its way. Check your inbox and spam.");
        return;
      }

      const response =
        mode === "LOGIN"
          ? await wixClient.auth.login({ email, password })
          : mode === "REGISTER"
          ? await wixClient.auth.register({ email, password, profile: name.trim() ? { nickname: name.trim() } : undefined })
          : await wixClient.auth.processVerification({ verificationCode: code.trim() });

      const outcome = interpretAuth(response, mode);
      if (outcome.kind === "success") {
        if (response?.loginState !== LoginState.SUCCESS) throw new Error("Wix said success without a session");
        await signedIn(response.data.sessionToken!);
        leaving = true; // the button stays off while the page changes, so a second tap cannot send it again
      } else if (outcome.kind === "verify") {
        setMode("EMAIL_VERIFICATION");
        setMessage(outcome.message);
      } else if (outcome.kind === "pending") {
        setMessage(outcome.message);
      } else {
        setError(outcome.message);
        if (outcome.suggest) setMode(outcome.suggest);
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error && err.message === "timeout"
          ? "Logging in took too long. Check your connection and try again."
          : "Something went wrong. Please try again."
      );
    } finally {
      if (!leaving) setIsLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 md:px-8 lg:px-16 lg:py-12 xl:px-32 2xl:px-64">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2 lg:gap-12">
        <AuthShowcase watches={watches} className="h-64 sm:h-72 lg:h-auto lg:min-h-[32rem]" />

        <div className="flex flex-col justify-center">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <h1 ref={heading} tabIndex={-1} className="font-display text-3xl font-bold focus:outline-none">
                {TITLES[mode]}
              </h1>
              <p className="mt-2 text-sm text-gray-600">{INTRO[mode]}</p>
            </div>

            {mode === "REGISTER" && (
              <div>
                <label htmlFor="auth-name" className={labelClass}>
                  Your name
                </label>
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Wanjiru"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldClass}
                />
              </div>
            )}

            {mode !== "EMAIL_VERIFICATION" ? (
              <div>
                <label htmlFor="auth-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldClass}
                />
              </div>
            ) : (
              <div>
                <label htmlFor="auth-code" className={labelClass}>
                  Verification code
                </label>
                <input
                  id="auth-code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  placeholder="Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={fieldClass}
                />
              </div>
            )}

            {(mode === "LOGIN" || mode === "REGISTER") && (
              <div>
                <PasswordField
                  id="auth-password"
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  autoComplete={mode === "LOGIN" ? "current-password" : "new-password"}
                  showStrength={mode === "REGISTER"}
                />
                {mode === "REGISTER" && password === "" && <p className="mt-1.5 text-xs text-gray-500">{PASSWORD_HELP}</p>}
                {mode === "LOGIN" && (
                  <button type="button" onClick={() => switchTo("RESET_PASSWORD")} className={`${link} mt-2`}>
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-brand-navy px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-gold hover:text-brand-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
            >
              {isLoading ? "Please wait..." : BUTTONS[mode]}
            </button>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="text-sm text-green-700">
                {message}
              </p>
            )}

            <div className="text-sm text-gray-600">
              {mode === "LOGIN" && (
                <>
                  New here?{" "}
                  <button type="button" onClick={() => switchTo("REGISTER")} className={link}>
                    Create an account
                  </button>
                </>
              )}
              {mode === "REGISTER" && (
                <>
                  Have an account?{" "}
                  <button type="button" onClick={() => switchTo("LOGIN")} className={link}>
                    Log in
                  </button>
                </>
              )}
              {(mode === "RESET_PASSWORD" || mode === "EMAIL_VERIFICATION") && (
                <button type="button" onClick={() => switchTo("LOGIN")} className={link}>
                  Back to log in
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
