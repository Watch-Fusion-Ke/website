"use client";

import { useState } from "react";
import {
  giftVoucherWhatsAppUrl,
  validateGiftVoucherRequest,
  type GiftVoucherErrors,
} from "@/lib/giftVoucherRequest";

const input =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-gold";
const label = "mb-1.5 block text-sm font-medium text-gray-700";
const error = "mt-1.5 text-sm text-red-600";

export default function GiftVoucherRequestForm() {
  const [errors, setErrors] = useState<GiftVoucherErrors>({});

  const continueToWhatsApp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const result = validateGiftVoucherRequest(data);
    if (!result.ok) {
      setErrors(result.errors);
      const first = (["amount", "senderName", "recipientName", "recipientEmail", "message"] as const).find(
        (key) => result.errors[key]
      );
      if (first) document.getElementById(`voucher-${first}`)?.focus();
      return;
    }

    setErrors({});
    window.location.assign(giftVoucherWhatsAppUrl(result.values));
  };

  return (
    <form onSubmit={continueToWhatsApp} noValidate className="space-y-5">
      <div>
        <label htmlFor="voucher-amount" className={label}>Gift amount (KES)</label>
        <input id="voucher-amount" name="amount" type="number" inputMode="numeric" min="1" step="1" required
          aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? "voucher-amount-error" : undefined}
          placeholder="5000" className={input} />
        {errors.amount && <p id="voucher-amount-error" className={error}>{errors.amount}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="voucher-senderName" className={label}>Your name</label>
          <input id="voucher-senderName" name="senderName" type="text" autoComplete="name" maxLength={80} required
            aria-invalid={Boolean(errors.senderName)} aria-describedby={errors.senderName ? "voucher-senderName-error" : undefined}
            placeholder="Your name" className={input} />
          {errors.senderName && <p id="voucher-senderName-error" className={error}>{errors.senderName}</p>}
        </div>
        <div>
          <label htmlFor="voucher-recipientName" className={label}>Recipient&apos;s name</label>
          <input id="voucher-recipientName" name="recipientName" type="text" maxLength={80} required
            aria-invalid={Boolean(errors.recipientName)} aria-describedby={errors.recipientName ? "voucher-recipientName-error" : undefined}
            placeholder="Who is the gift for?" className={input} />
          {errors.recipientName && <p id="voucher-recipientName-error" className={error}>{errors.recipientName}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="voucher-recipientEmail" className={label}>Recipient&apos;s email</label>
        <input id="voucher-recipientEmail" name="recipientEmail" type="email" inputMode="email" autoCapitalize="none"
          spellCheck={false} autoComplete="off" maxLength={254} required
          aria-invalid={Boolean(errors.recipientEmail)} aria-describedby={errors.recipientEmail ? "voucher-recipientEmail-error" : undefined}
          placeholder="recipient@example.com" className={input} />
        {errors.recipientEmail && <p id="voucher-recipientEmail-error" className={error}>{errors.recipientEmail}</p>}
      </div>

      <div>
        <label htmlFor="voucher-message" className={label}>Personal message <span className="font-normal">(optional)</span></label>
        <textarea id="voucher-message" name="message" rows={4} maxLength={500}
          aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "voucher-message-error" : undefined}
          placeholder="Write a note for the recipient" className={`${input} resize-y`} />
        {errors.message && <p id="voucher-message-error" className={error}>{errors.message}</p>}
      </div>

      <p className="text-sm text-gray-600">
        Your details will open in a WhatsApp message for you to review and send. No voucher is issued or paid for by this form.
      </p>
      <button type="submit"
        className="min-h-12 w-full rounded-lg bg-brand-navy px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-gold hover:text-brand-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold">
        Continue to WhatsApp
      </button>
    </form>
  );
}
