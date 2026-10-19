import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ContactForm from "@/components/ContactForm";

const html = renderToStaticMarkup(<ContactForm initialAvailable />);

describe("ContactForm", () => {
  it("labels every box and gives phones the right autofill and keyboard", () => {
    expect(html).toContain('for="contact-name"');
    expect(html).toContain('for="contact-email"');
    expect(html).toContain('for="contact-message"');
    expect(html).toContain('autoComplete="name"');
    expect(html).toContain('autoComplete="email"');
    expect(html).toContain('type="email"');
    expect(html).toContain("<textarea");
  });

  it("marks the three boxes as required and limits how much can be typed", () => {
    expect(html.match(/required=""/g)?.length).toBeGreaterThanOrEqual(3);
    expect(html).toContain('maxLength="80"');
    expect(html).toContain('maxLength="2000"');
  });

  it("holds a hidden trap box that people never see or tab to", () => {
    expect(html).toMatch(/aria-hidden="true"[^>]*>[\s\S]*name="c_ref_check"/);
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('autoComplete="off"');
  });

  it("has a clear send button that is tall enough to tap", () => {
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>Send message<\/button>/);
    expect(html).toMatch(/min-h-12/);
  });

  it("starts quiet, with no message and no error showing", () => {
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('role="status"');
  });

  it("shows no form until the shop has said the form works, so nobody writes a message that cannot be sent", () => {
    const waiting = renderToStaticMarkup(<ContactForm />);
    expect(waiting).not.toContain("<form");
    expect(waiting).not.toContain("<textarea");
  });

  it("offers WhatsApp, a call and email instead when the form is not available", () => {
    const off = renderToStaticMarkup(<ContactForm initialAvailable={false} />);
    expect(off).not.toContain("<form");
    expect(off).toContain("https://wa.me/254796044969");
    expect(off).toContain("tel:+254796044969");
    expect(off).toContain("mailto:");
  });

  it("names the trap box something no password manager or browser fills in", () => {
    expect(html).not.toContain('name="website"');
    expect(html).toContain('name="c_ref_check"');
  });

  it("uses no pink", () => {
    expect(html).not.toMatch(/pink|rose|fuchsia/);
  });
});
