import { describe, expect, it } from "vitest";
import { giftVoucherMessage, giftVoucherWhatsAppUrl, validateGiftVoucherRequest } from "@/lib/giftVoucherRequest";

const request = {
  amount: "5000",
  senderName: "  Jane Wanjiru  ",
  recipientName: "Amina",
  recipientPhone: "0712 345 679",
  recipientEmail: "amina@example.com",
  message: "Happy birthday!",
};

describe("gift voucher request handoff", () => {
  it("normalises the entered details and prepares a WhatsApp message for staff review", () => {
    const result = validateGiftVoucherRequest(request);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.values.senderName).toBe("Jane Wanjiru");
    expect(result.values.recipientPhone).toBe("0712345679");
    const url = new URL(giftVoucherWhatsAppUrl(result.values));
    expect(url.host).toBe("wa.me");
    expect(url.pathname).toBe("/254796044969");
    expect(url.searchParams.get("text")).toContain("Amount requested: KES 5,000");
    expect(url.searchParams.get("text")).toContain("Recipient details:\nName: Amina\nPhone: 0712345679\nEmail: amina@example.com");
    expect(url.searchParams.get("text")).not.toMatch(/sender phone/i);
    expect(url.searchParams.get("text")).toContain("Please confirm my voucher request and share the payment instructions so I can pay.");
    expect(url.searchParams.get("text")).toContain("issued only after payment is confirmed");
  });

  it("rejects invalid amounts and recipient emails before opening WhatsApp", () => {
    for (const amount of ["0", "-5", "12.5", "5000abc", "1000000000"]) {
      const result = validateGiftVoucherRequest({ ...request, amount });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.amount).toBeDefined();
    }
    const email = validateGiftVoucherRequest({ ...request, recipientEmail: "not-an-email" });
    expect(email.ok).toBe(false);
    if (!email.ok) expect(email.errors.recipientEmail).toBeDefined();
    for (const phone of ["", "12345", "0712 ext 123", "+254712345678?amount=1"]) {
      const result = validateGiftVoucherRequest({ ...request, recipientPhone: phone });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.recipientPhone).toBeDefined();
    }
  });

  it("keeps names on one line and encodes special characters in the optional message", () => {
    const result = validateGiftVoucherRequest({ ...request, senderName: "Jane\nAmount: free", message: "For you & me 🎁" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(giftVoucherMessage(result.values)).toContain("From: Jane Amount: free\nRecipient details:\nName: Amina");
    expect(new URL(giftVoucherWhatsAppUrl(result.values)).searchParams.get("text")).toContain("For you & me 🎁");
  });
});
