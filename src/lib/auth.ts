import { LoginState } from "@wix/sdk";

// What the sign-in screen does with an answer from Wix, and how strong a new password is.
// Docs: https://dev.wix.com/docs/go-headless/authentication/members/custom-login-page/build-a-custom-login-page-js-sdk (Step 5, failed states)

export type AuthMode = "LOGIN" | "REGISTER" | "RESET_PASSWORD" | "EMAIL_VERIFICATION";

export type AuthOutcome =
  | { kind: "success" }
  | { kind: "verify"; message: string }
  | { kind: "pending"; message: string }
  | { kind: "error"; message: string; suggest?: AuthMode };

type WixAnswer = { loginState?: unknown; errorCode?: string } | undefined;

export const PASSWORD_HELP = "Use at least 8 characters, with a letter and a number.";

export const interpretAuth = (response: WixAnswer, mode: AuthMode): AuthOutcome => {
  switch (response?.loginState) {
    case LoginState.SUCCESS:
      return { kind: "success" };
    case LoginState.EMAIL_VERIFICATION_REQUIRED:
      return { kind: "verify", message: "We sent a code to your email. Enter it below to finish." };
    case LoginState.OWNER_APPROVAL_REQUIRED:
      return { kind: "pending", message: "Your account is waiting for approval. You can log in once it is approved." };
    case LoginState.FAILURE:
      switch (response.errorCode) {
        case "invalidEmail":
          return {
            kind: "error",
            message: mode === "REGISTER" ? "Check the email address and try again." : "That email or password is not right.",
          };
        case "invalidPassword":
          return {
            kind: "error",
            message: mode === "REGISTER" ? `That password was not accepted. ${PASSWORD_HELP}` : "That email or password is not right.",
          };
        case "emailAlreadyExists":
          return { kind: "error", message: "An account with this email already exists. Log in instead.", suggest: "LOGIN" };
        case "resetPassword":
          return { kind: "error", message: "You need to reset your password first.", suggest: "RESET_PASSWORD" };
        default:
          return { kind: "error", message: "Something went wrong. Please try again." };
      }
    default:
      return { kind: "error", message: "Something went wrong. Please try again." };
  }
};

const COMMON = new Set([
  "password", "password1", "password12", "password123", "12345678", "123456789", "1234567890",
  "qwerty123", "qwertyuiop", "iloveyou1", "welcome1", "abc12345", "11111111", "00000000", "letmein1", "admin123",
]);

export type StrengthRule = { label: string; ok: boolean };
export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string; meetsMinimum: boolean; rules: StrengthRule[] };

export const passwordStrength = (pw: string): Strength => {
  const rules: StrengthRule[] = [
    { label: "At least 8 characters", ok: pw.length >= 8 },
    { label: "A letter", ok: /[A-Za-z]/.test(pw) },
    { label: "A number", ok: /\d/.test(pw) },
  ];
  const meetsMinimum = rules.every((r) => r.ok);
  if (pw === "") return { score: 0, label: "", meetsMinimum: false, rules };
  if (!meetsMinimum) return { score: 1, label: "Too weak", meetsMinimum, rules };
  if (COMMON.has(pw.toLowerCase())) return { score: 1, label: "Too common", meetsMinimum, rules };

  let score = 2;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score += 1;
  return { score: score as 2 | 3 | 4, label: ["", "", "Okay", "Good", "Strong"][score], meetsMinimum, rules };
};
