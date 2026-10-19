import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import PasswordField from "@/components/auth/PasswordField";
import AuthShowcase from "@/components/auth/AuthShowcase";
import AuthForm from "@/components/auth/AuthForm";
import LoginCallbackView from "@/components/auth/LoginCallbackView";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }));

const noop = () => {};
const watches = [1, 2, 3, 4].map((n) => ({ id: `w${n}`, name: `Watch ${n}`, imageUrl: `https://img/${n}.jpg`, priceLabel: `KES ${n}00` }));

describe("PasswordField", () => {
  const field = (value = "", extra: Record<string, unknown> = {}) =>
    renderToStaticMarkup(<PasswordField id="pw" label="Password" value={value} onChange={noop} autoComplete="new-password" {...extra} />);

  it("hides the password and offers a button to show it", () => {
    const html = field("secret");
    expect(html).toContain('type="password"');
    expect(html).toMatch(/<button[^>]*aria-pressed="false"[^>]*aria-label="Show password"/);
    expect(html).toMatch(/<button[^>]*type="button"/);
  });

  it("links the label to the box and passes the autofill hint", () => {
    const html = field();
    expect(html).toContain('for="pw"');
    expect(html).toContain('id="pw"');
    expect(html).toContain('autoComplete="new-password"');
  });

  it("shows no strength meter unless asked, and none for an empty box", () => {
    expect(field("abcdefg1")).not.toContain("Okay");
    expect(field("", { showStrength: true })).not.toContain('role="progressbar"');
  });

  it("shows how strong the password is and which rules it meets", () => {
    const html = field("abcdefg1", { showStrength: true });
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="2"');
    expect(html).toContain("Okay");
    expect(html).toContain("At least 8 characters");
    expect(html).toContain('aria-live="polite"');
  });

  it("uses no pink", () => {
    expect(field("abc", { showStrength: true })).not.toMatch(/pink|rose|fuchsia/);
  });
});

describe("AuthShowcase", () => {
  const html = renderToStaticMarkup(<AuthShowcase watches={watches} />);

  it("shows the first watch and hides the others from screen readers", () => {
    expect(html.match(/aria-hidden="false"/g)).toHaveLength(1);
    expect(html.match(/data-slide/g)).toHaveLength(4);
    expect(html).toContain("Watch 1");
  });

  it("lets the shopper pause the moving watches", () => {
    expect(html).toMatch(/<button[^>]*aria-pressed="false"[^>]*>[^<]*Pause/);
  });

  it("shows nothing moving for one watch or none", () => {
    expect(renderToStaticMarkup(<AuthShowcase watches={watches.slice(0, 1)} />)).not.toContain("Pause");
    expect(renderToStaticMarkup(<AuthShowcase watches={[]} />)).toBe("");
  });
});

describe("AuthForm", () => {
  const form = (mode?: string) => renderToStaticMarkup(<AuthForm initialMode={mode as never} watches={watches} />);

  it("labels every box and gives the phone's autofill the right hints when logging in", () => {
    const html = form("LOGIN");
    expect(html).toContain('for="auth-email"');
    expect(html).toContain('autoComplete="email"');
    expect(html).toContain("current-password");
    expect(html).toContain('<h1');
    expect(html).toContain("Log in");
  });

  it("uses real buttons, not clickable text, to switch between the forms", () => {
    const html = form("LOGIN");
    expect(html).not.toMatch(/<div[^>]*cursor-pointer/);
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>[^<]*Forgot password\?/);
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>[^<]*Create an account/);
  });

  it("asks for a name, an email and a password with a strength meter when registering", () => {
    const html = form("REGISTER");
    expect(html).toContain('for="auth-name"');
    expect(html).toContain("new-password");
    expect(html).toContain("Have an account?");
    expect(html).not.toContain("Have and account");
  });

  it("asks only for the email when resetting the password", () => {
    const html = form("RESET_PASSWORD");
    expect(html).toContain('for="auth-email"');
    expect(html).not.toContain('type="password"');
    expect(html).toContain("Back to log in");
  });

  it("asks for the emailed code when verifying", () => {
    const html = form("EMAIL_VERIFICATION");
    expect(html).toContain("one-time-code");
    expect(html).not.toContain('for="auth-email"');
  });

  it("puts the moving watches beside the form, and uses no pink", () => {
    const html = form("LOGIN");
    expect(html).toContain("data-slide");
    expect(html).not.toMatch(/pink|rose|fuchsia/);
  });
});

describe("LoginCallbackView", () => {
  it("tells the shopper it is finishing, while it works", () => {
    const html = renderToStaticMarkup(<LoginCallbackView />);
    expect(html).toContain('role="status"');
    expect(html).toContain("Logging you in");
    expect(html).not.toContain('role="alert"');
  });

  it("explains a failure and offers the way back to the login", () => {
    const html = renderToStaticMarkup(<LoginCallbackView message="We could not finish logging you in. Please log in again." />);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Please log in again");
    expect(html).toContain('href="/login"');
  });
});
