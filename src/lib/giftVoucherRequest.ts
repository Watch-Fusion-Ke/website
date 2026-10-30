import { WHATSAPP_NUMBER } from "@/lib/contact";

export type GiftVoucherRequest = {
  amount: number;
  senderName: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  message: string;
};

export type GiftVoucherErrors = Partial<Record<"amount" | "senderName" | "recipientName" | "recipientPhone" | "recipientEmail" | "message", string>>;

const cleanName = (value: unknown): string =>
  (typeof value === "string" ? value : "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const cleanMessage = (value: unknown): string =>
  (typeof value === "string" ? value : "")
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "")
    .trim();

const cleanPhone = (value: unknown): string =>
  (typeof value === "string" ? value : "").replace(/[\s().-]/g, "").trim();

export const validateGiftVoucherRequest = (
  raw: Record<string, unknown>
): { ok: true; values: GiftVoucherRequest } | { ok: false; errors: GiftVoucherErrors } => {
  const amountText = typeof raw.amount === "string" ? raw.amount.trim() : "";
  const senderName = cleanName(raw.senderName);
  const recipientName = cleanName(raw.recipientName);
  const recipientPhone = cleanPhone(raw.recipientPhone);
  const recipientEmail = typeof raw.recipientEmail === "string" ? raw.recipientEmail.trim() : "";
  const message = cleanMessage(raw.message);
  const errors: GiftVoucherErrors = {};

  // The amount is a request, not a price or a payment. Staff confirm it in WhatsApp.
  if (!/^[1-9]\d{0,8}$/.test(amountText)) errors.amount = "Enter a whole KES amount greater than zero.";
  if (senderName.length < 2 || senderName.length > 80) errors.senderName = "Enter your name (2 to 80 characters).";
  if (recipientName.length < 2 || recipientName.length > 80) errors.recipientName = "Enter the recipient's name (2 to 80 characters).";
  if (!/^\+?\d{9,15}$/.test(recipientPhone)) errors.recipientPhone = "Enter the recipient's phone number (9 to 15 digits).";
  if (recipientEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    errors.recipientEmail = "Enter a valid recipient email address.";
  }
  if (message.length > 500) errors.message = "Keep the personal message under 500 characters.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    values: { amount: Number(amountText), senderName, recipientName, recipientPhone, recipientEmail, message },
  };
};

const wellFormed = (value: string): string =>
  value.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "\uFFFD");

export const giftVoucherMessage = (request: GiftVoucherRequest): string =>
  [
    "Hello Watch Fusion Kenya, I would like to request a gift voucher.",
    "",
    `Amount requested: KES ${request.amount.toLocaleString("en-KE")}`,
    `From: ${request.senderName}`,
    "Recipient details:",
    `Name: ${request.recipientName}`,
    `Phone: ${request.recipientPhone}`,
    `Email: ${request.recipientEmail}`,
    ...(request.message ? ["", `Personal message: ${request.message}`] : []),
    "",
    "Please confirm my voucher request and share the payment instructions so I can pay. I understand the voucher will be issued only after payment is confirmed.",
  ].join("\n");

export const giftVoucherWhatsAppUrl = (request: GiftVoucherRequest): string =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(wellFormed(giftVoucherMessage(request)))}`;
