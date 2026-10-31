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
    expect(html.indexOf('name="senderName"')).toBeGreaterThan(chips);
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
});
