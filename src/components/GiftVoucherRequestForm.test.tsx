import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import GiftVoucherRequestForm from "@/components/GiftVoucherRequestForm";
import { VOUCHER_PRESET_AMOUNTS } from "@/lib/giftVoucherRequest";

describe("the gift voucher request form", () => {
  const html = renderToStaticMarkup(<GiftVoucherRequestForm />);

  it("offers quick amounts as buttons that fill in the amount, and still lets the shopper type any amount", () => {
    const group = html.match(/<div[^>]*role="group"[^>]*aria-label="Quick amounts"[^>]*>[\s\S]*?<\/div>/)?.[0] ?? "";
    expect(group).not.toBe("");
    const buttons = group.match(/<button[^>]*>[^<]*<\/button>/g) ?? [];
    expect(buttons).toHaveLength(VOUCHER_PRESET_AMOUNTS.length);
    VOUCHER_PRESET_AMOUNTS.forEach((amount, i) => {
      expect(buttons[i]).toContain('type="button"');
      // The field is already headed "KES", so the button shows only the number; a screen reader still hears the currency.
      expect(buttons[i]).toContain(`>${amount.toLocaleString("en-KE")}</button>`);
      expect(buttons[i]).toContain(`aria-label="KES ${amount.toLocaleString("en-KE")}"`);
      expect(buttons[i]).toMatch(/min-h-11/);
    });
    expect(html).toContain('name="amount"');
  });

  it("keeps the quick amounts on one line, so they stay next to their field in the narrow desktop column", () => {
    const group = html.match(/<div[^>]*role="group"[^>]*aria-label="Quick amounts"[^>]*>/)?.[0] ?? "";
    expect(group).toContain("flex-nowrap");
    expect(group).not.toContain("flex-wrap");
  });

  it("puts the quick amounts right under the field they fill", () => {
    const field = html.indexOf('name="amount"');
    const chips = html.indexOf('aria-label="Quick amounts"');
    expect(field).toBeGreaterThan(-1);
    expect(chips).toBeGreaterThan(field);
    expect(html.indexOf('name="recipientName"')).toBeGreaterThan(chips);
  });

  it("gives the amount its own section first and the shopper's own details last", () => {
    expect(html.indexOf("1</span> Amount")).toBeGreaterThan(-1);
    expect(html.indexOf('name="amount"')).toBeLessThan(html.indexOf('name="recipientName"'));
    expect(html.indexOf('name="recipientEmail"')).toBeLessThan(html.indexOf('name="senderName"'));
    expect(html.indexOf('name="senderName"')).toBeLessThan(html.indexOf('name="message"'));
  });

  it("puts one plain line under the button, saying nothing is paid on this page", () => {
    const button = html.indexOf("Continue to WhatsApp");
    expect(html.slice(button)).toContain("Nothing is charged here. We confirm payment on WhatsApp.");
  });

  it("moves focus to the first field with an error in the order the fields appear on the page", () => {
    const source = readFileSync("src/components/GiftVoucherRequestForm.tsx", "utf8");
    const order = source.match(/\(\[([^\]]*)\] as const\)\.find/)?.[1].match(/"(\w+)"/g)?.map((key) => key.slice(1, -1)) ?? [];
    const onPage = (html.match(/<(?:input|textarea)[^>]*\bname="(\w+)"/g) ?? []).map((tag) => tag.match(/name="(\w+)"/)?.[1]);
    expect(order).toEqual(onPage);
  });

  it("tells a screen reader which quick amount is chosen", () => {
    expect(html).toMatch(/aria-pressed="false"/);
  });
});

describe("the gift voucher introduction", () => {
  const source = readFileSync("src/components/GiftVoucherIntro.tsx", "utf8");

  it("opens by itself only on a phone and only the first time, and can always be opened again with its button", () => {
    expect(source).toContain("introSeen");
    expect(source).toContain("markIntroSeen");
    expect(source).toContain("How it works");
    expect(source.indexOf("introSeen")).toBeLessThan(source.indexOf("showModal"));
  });

  it("counts the introduction as seen when the shopper dismisses it, not when it opens, so the page never loses it by closing it for them", () => {
    const effect = source.slice(source.indexOf("useEffect(() =>"), source.indexOf("}, []);"));
    expect(effect).not.toContain("markIntroSeen(");
    expect(source).toMatch(/const remember = [\s\S]*markIntroSeen\(/);
    expect(source).toMatch(/const start = \(\) => \{\s*remember\(\)/);
    expect(source).toContain("onCancel");
  });

  it("promises the emailed code only, since the card artwork is not made yet", () => {
    const steps = readFileSync("src/lib/voucherSteps.ts", "utf8");
    expect(steps).toContain("email the code to the recipient");
    expect(steps).not.toMatch(/code and card/i);
  });

  it("reads its steps from the same list as the page, so the two never disagree", () => {
    expect(source).toContain("VOUCHER_STEPS");
    expect(source).not.toContain("Fill in the details");
  });
});
