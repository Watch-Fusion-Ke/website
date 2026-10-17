import { describe, expect, it } from "vitest";
import { LoginState } from "@wix/sdk";
import { interpretAuth, passwordStrength } from "@/lib/auth";

const failure = (errorCode?: string) => ({ loginState: LoginState.FAILURE, errorCode }) as never;

describe("interpretAuth", () => {
  it("lets the shopper in on success", () => {
    expect(interpretAuth({ loginState: LoginState.SUCCESS } as never, "REGISTER")).toEqual({ kind: "success" });
  });

  it("asks for the emailed code when Wix says the email needs verifying", () => {
    expect(interpretAuth({ loginState: LoginState.EMAIL_VERIFICATION_REQUIRED } as never, "REGISTER").kind).toBe("verify");
  });

  it("tells the shopper the account waits for approval, and nothing else", () => {
    const result = interpretAuth({ loginState: LoginState.OWNER_APPROVAL_REQUIRED } as never, "REGISTER");
    expect(result.kind).toBe("pending");
  });

  it("never turns a failure into the verification screen or the approval notice", () => {
    for (const code of ["invalidEmail", "invalidPassword", "emailAlreadyExists", "resetPassword", "somethingNew", undefined]) {
      for (const mode of ["LOGIN", "REGISTER"] as const) {
        const kind = interpretAuth(failure(code), mode).kind;
        expect(["verify", "pending", "success"]).not.toContain(kind);
      }
    }
  });

  it("says plainly that the email or password is wrong when logging in", () => {
    for (const code of ["invalidEmail", "invalidPassword"]) {
      const result = interpretAuth(failure(code), "LOGIN");
      expect(result).toMatchObject({ kind: "error" });
      expect((result as { message: string }).message).toMatch(/email or password/i);
    }
  });

  it("explains a rejected password when registering, so the shopper can fix it", () => {
    const result = interpretAuth(failure("invalidPassword"), "REGISTER") as { kind: string; message: string };
    expect(result.kind).toBe("error");
    expect(result.message).toMatch(/password/i);
    expect(result.message).toMatch(/8/);
    expect(result.message).not.toMatch(/email or password/i);
  });

  it("points a shopper whose email already has an account to the login", () => {
    expect(interpretAuth(failure("emailAlreadyExists"), "REGISTER")).toMatchObject({ kind: "error", suggest: "LOGIN" });
  });

  it("sends a shopper who must reset their password to the reset form", () => {
    expect(interpretAuth(failure("resetPassword"), "LOGIN")).toMatchObject({ kind: "error", suggest: "RESET_PASSWORD" });
  });

  it("gives a plain message for anything else, including no response", () => {
    expect(interpretAuth(failure("unheardOf"), "LOGIN")).toMatchObject({ kind: "error" });
    expect(interpretAuth(undefined, "LOGIN")).toMatchObject({ kind: "error" });
  });
});

describe("passwordStrength", () => {
  const check = (pw: string) => passwordStrength(pw);

  it("shows nothing for an empty password", () => {
    expect(check("")).toMatchObject({ score: 0, label: "", meetsMinimum: false });
  });

  it("asks for at least 8 characters with a letter and a number", () => {
    expect(check("abc1").meetsMinimum).toBe(false);
    expect(check("abcdefgh").meetsMinimum).toBe(false);
    expect(check("12345678").meetsMinimum).toBe(false);
    expect(check("abcdefg1").meetsMinimum).toBe(true);
  });

  it("calls a password under the minimum weak", () => {
    expect(check("abc1")).toMatchObject({ score: 1, label: "Too weak" });
  });

  it("calls a very common password weak even when it meets the minimum", () => {
    expect(check("password1")).toMatchObject({ score: 1, label: "Too common" });
    expect(check("Password1").score).toBe(1);
  });

  it("rises with capitals, a symbol and length", () => {
    expect(check("abcdefg1")).toMatchObject({ score: 2, label: "Okay" });
    expect(check("Abcdefg1").score).toBe(3);
    expect(check("Abcdefg1!xyz")).toMatchObject({ score: 4, label: "Strong" });
  });

  it("lists each rule with whether it is met", () => {
    const rules = check("abcdefg1").rules;
    expect(rules.map((r) => r.label)).toEqual(["At least 8 characters", "A letter", "A number"]);
    expect(rules.every((r) => r.ok)).toBe(true);
    expect(check("abc").rules.map((r) => r.ok)).toEqual([false, true, false]);
  });
});
