import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import GiftVouchersPage from "@/app/gift-vouchers/page";
import { VOUCHER_STEPS } from "@/lib/voucherSteps";

const readable = (markup: string) =>
  markup
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

describe("gift voucher request page", () => {
  const html = renderToStaticMarkup(<GiftVouchersPage />);

  it("asks for only the sender's name, after the recipient details", () => {
    expect(html).toContain('name="senderName"');
    expect(html).not.toContain('name="senderPhone"');
    expect(html).not.toMatch(/Your phone|Sender phone/i);
    expect(html.indexOf('name="senderName"')).toBeGreaterThan(html.indexOf('name="recipientEmail"'));
  });

  it("groups the form into three sections, amount, recipient and sender, each with a heading", () => {
    const legends = (html.match(/<legend[^>]*>[\s\S]*?<\/legend>/g) ?? []).map(readable);
    expect(legends).toEqual(["1 Amount", "2 Who it is for", "3 From you"]);
    const recipient = html.match(/<fieldset(?:(?!<\/fieldset>)[\s\S])*Who it is for[\s\S]*?<\/fieldset>/)?.[0] ?? "";
    expect(recipient).toContain('name="recipientName"');
    expect(recipient).toContain('name="recipientPhone"');
    expect(recipient).toContain('name="recipientEmail"');
    expect(recipient).toMatch(/>Name<\/label>[\s\S]*>Phone number<\/label>[\s\S]*>Email address<\/label>/);
  });

  it("is easy to read at a glance: a short intro, three one-line steps and a form, in about 150 words in all", () => {
    expect(readable(html).split(" ").length).toBeLessThanOrEqual(150);
  });

  it("lists the steps once on the page, as a short numbered row, each with a title and a few words", () => {
    const steps = html.match(/<ol[^>]*data-voucher-steps[^>]*>[\s\S]*?<\/ol>/)?.[0] ?? "";
    expect(steps.match(/<li\b/g)).toHaveLength(VOUCHER_STEPS.length);
    VOUCHER_STEPS.forEach((step) => {
      expect(steps).toContain(step.title);
      expect(step.detail.split(" ").length).toBeLessThanOrEqual(7);
    });
  });

  it("has no side column, so the eye follows one line from the heading to the button", () => {
    expect(html).not.toContain("<aside");
    expect(html).not.toMatch(/\b(?:sm|md|lg|xl):grid-cols-\[minmax\(0,1\.\d+fr\)_/);
  });

  it("keeps a single line that a voucher is a unique code and a screenshot alone is not honoured", () => {
    expect(html).toMatch(/unique code/i);
    expect(html).toMatch(/screenshot/i);
  });

  it("does not promise a way to redeem the code that has not been tried on the live checkout", () => {
    expect(readable(html)).not.toMatch(/at checkout/i);
  });

  it("sets its small headings in navy, never the light gold, which cannot be read on the white page", () => {
    expect(html).not.toContain("text-brand-gold-dark");
    expect(readFileSync("src/components/GiftVoucherIntro.tsx", "utf8")).not.toContain("text-brand-gold-dark");
    expect(readFileSync("src/components/GiftVoucherRequestForm.tsx", "utf8")).not.toContain("text-brand-gold-dark");
    expect(readFileSync("src/app/gift-vouchers/page.tsx", "utf8")).not.toContain("text-brand-gold-dark");
  });
});
