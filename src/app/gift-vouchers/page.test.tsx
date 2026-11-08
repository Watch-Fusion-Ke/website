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

  it("is easy to read at a glance: a short intro, three one-line steps and a form, in about 130 words in all", () => {
    expect(readable(html).split(" ").length).toBeLessThanOrEqual(130);
  });

  it("sets the short guide beside the form on a computer, as three numbered steps with a title and a few words each", () => {
    const aside = html.match(/<aside[^>]*>[\s\S]*?<\/aside>/)?.[0] ?? "";
    expect(aside).toMatch(/\bhidden\b[^"]*\blg:block\b/);
    const steps = aside.match(/<ol[^>]*data-voucher-steps[^>]*>[\s\S]*?<\/ol>/)?.[0] ?? "";
    expect(steps.match(/<li\b/g)).toHaveLength(VOUCHER_STEPS.length);
    VOUCHER_STEPS.forEach((step) => {
      expect(steps).toContain(step.title);
      expect(step.detail.split(" ").length).toBeLessThanOrEqual(7);
    });
    expect(html).toMatch(/lg:grid-cols-\[minmax\(0,1fr\)_\d+rem\]/);
  });

  it("puts the form before the guide, so on a phone, where the pop-up carries the guide, the form comes first", () => {
    expect(html.indexOf("<form")).toBeLessThan(html.indexOf("<aside"));
  });

  it("ends with the form, with no notes after it", () => {
    const form = html.indexOf("</form>");
    expect(readable(html.slice(form))).not.toMatch(/unique code|screenshot|Nothing is charged/i);
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
