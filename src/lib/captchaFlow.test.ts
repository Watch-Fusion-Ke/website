import { describe, expect, it } from "vitest";
import { LoginState } from "@wix/sdk";
import { signInWithCaptcha } from "@/lib/captchaFlow";

const ok = { loginState: LoginState.SUCCESS, data: { sessionToken: "s" } } as never;
const missing = { loginState: LoginState.FAILURE, errorCode: "missingCaptchaToken" } as never;
const invalid = { loginState: LoginState.FAILURE, errorCode: "invalidCaptchaToken" } as never;
const wrongPassword = { loginState: LoginState.FAILURE, errorCode: "invalidPassword" } as never;

type Tokens = { recaptchaToken?: string; invisibleRecaptchaToken?: string } | undefined;

// A pretend Wix: each answer is used up in turn, and every call is recorded.
const setup = (answers: unknown[], over: { invisible?: () => Promise<string> } = {}) => {
  const sent: Tokens[] = [];
  const queue = [...answers];
  const deps = {
    mode: "LOGIN" as const,
    send: async (tokens: Tokens) => {
      sent.push(tokens);
      return queue.shift() as never;
    },
    getInvisibleToken: over.invisible ?? (async () => "invisible-1"),
  };
  return { deps, sent };
};

describe("signInWithCaptcha", () => {
  it("sends once, with no check, when the site does not ask for one", async () => {
    const { deps, sent } = setup([ok]);
    const result = await signInWithCaptcha({ ...deps });
    expect(sent).toEqual([undefined]);
    expect(result.outcome.kind).toBe("success");
    expect(result.learned).toBeNull();
  });

  it("when Wix asks for a check, tries the silent one first and sends it", async () => {
    const { deps, sent } = setup([missing, ok]);
    const result = await signInWithCaptcha({ ...deps });
    expect(sent).toEqual([undefined, { invisibleRecaptchaToken: "invisible-1" }]);
    expect(result.outcome.kind).toBe("success");
    expect(result.learned).toBe("invisible");
  });

  it("asks for the visible box when Wix refuses the silent check", async () => {
    const { deps, sent } = setup([missing, invalid]);
    const result = await signInWithCaptcha({ ...deps });
    expect(sent).toHaveLength(2);
    expect(result.outcome.kind).toBe("captcha");
    expect(result.learned).toBe("visible");
  });

  it("asks for the visible box when the silent check cannot run at all", async () => {
    const { deps, sent } = setup([missing], {
      invisible: async () => {
        throw new Error("blocked");
      },
    });
    const result = await signInWithCaptcha({ ...deps });
    expect(sent).toHaveLength(1);
    expect(result.outcome.kind).toBe("captcha");
    expect(result.learned).toBe("visible");
  });

  it("gets the silent check first when it already worked in this visit, so there is no failed attempt", async () => {
    const { deps, sent } = setup([ok]);
    const result = await signInWithCaptcha({ ...deps, remembered: "invisible" });
    expect(sent).toEqual([{ invisibleRecaptchaToken: "invisible-1" }]);
    expect(result.outcome.kind).toBe("success");
  });

  it("falls back to asking when the remembered silent check is now refused", async () => {
    const { deps } = setup([missing]);
    const result = await signInWithCaptcha({ ...deps, remembered: "invisible" });
    expect(result.outcome.kind).toBe("captcha");
    expect(result.learned).toBe("visible");
  });

  it("sends the ticked box with it, and does not try anything else", async () => {
    const { deps, sent } = setup([ok]);
    const result = await signInWithCaptcha({ ...deps, visibleToken: "box-1" });
    expect(sent).toEqual([{ recaptchaToken: "box-1" }]);
    expect(result.outcome.kind).toBe("success");
    expect(result.learned).toBe("visible");
  });

  it("asks again when a ticked box is refused", async () => {
    const { deps, sent } = setup([invalid]);
    const result = await signInWithCaptcha({ ...deps, visibleToken: "box-1" });
    expect(sent).toHaveLength(1);
    expect(result.outcome.kind).toBe("captcha");
  });

  it("passes any other answer straight back, such as a wrong password", async () => {
    const { deps, sent } = setup([wrongPassword]);
    const result = await signInWithCaptcha({ ...deps });
    expect(sent).toHaveLength(1);
    expect(result.outcome.kind).toBe("error");
  });

  it("shows the box when Wix takes the silent check but wants a real answer, which it reports as a failure with no reason", async () => {
    const unclear = { loginState: LoginState.FAILURE } as never;
    const first = setup([missing, unclear]);
    const result = await signInWithCaptcha({ ...first.deps });
    expect(result.outcome.kind).toBe("captcha");
    expect(result.learned).toBe("visible");

    const remembered = setup([unclear]);
    const again = await signInWithCaptcha({ ...remembered.deps, remembered: "invisible" });
    expect(again.outcome.kind).toBe("captcha");
    expect(again.learned).toBe("visible");
  });

  it("does not take a plain failure with no reason for a robot check when no silent check was sent", async () => {
    const { deps } = setup([{ loginState: LoginState.FAILURE } as never]);
    const result = await signInWithCaptcha({ ...deps });
    expect(result.outcome.kind).toBe("error");
  });

  it("does not try the silent check after a wrong password that follows it", async () => {
    const { deps, sent } = setup([missing, wrongPassword]);
    const result = await signInWithCaptcha({ ...deps });
    expect(sent).toHaveLength(2);
    expect(result.outcome.kind).toBe("error");
    expect(result.learned).toBe("invisible");
  });
});
