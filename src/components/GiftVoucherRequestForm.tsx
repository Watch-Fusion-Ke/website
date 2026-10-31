"use client";

import { useState } from "react";
import {
  VOUCHER_PRESET_AMOUNTS,
  giftVoucherWhatsAppUrl,
  validateGiftVoucherRequest,
  type GiftVoucherErrors,
} from "@/lib/giftVoucherRequest";

const input =
  "min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-gold";
const label = "mb-1 block text-sm font-medium text-gray-700";
const error = "mt-1 text-sm text-red-600";

export default function GiftVoucherRequestForm() {
  const [errors, setErrors] = useState<GiftVoucherErrors>({});
  const [amount, setAmount] = useState("");

  const continueToWhatsApp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const result = validateGiftVoucherRequest(data);
    if (!result.ok) {
      setErrors(result.errors);
      const first = (["amount", "senderName", "recipientName", "recipientPhone", "recipientEmail", "message"] as const).find(
        (key) => result.errors[key]
      );
      if (first) document.getElementById(`voucher-${first}`)?.focus();
      return;
    }

    setErrors({});
    window.location.assign(giftVoucherWhatsAppUrl(result.values));
  };

  return (
    <form onSubmit={continueToWhatsApp} noValidate className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2 lg:gap-y-2">
      <div>
        <label htmlFor="voucher-amount" className={label}>Gift amount (KES)</label>
        <input id="voucher-amount" name="amount" type="number" inputMode="numeric" min="1" step="1" required
          aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? "voucher-amount-error" : undefined}
          value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="5000" className={input} />
        <div role="group" aria-label="Quick amounts" className="mt-2 flex flex-nowrap gap-1.5">
          {VOUCHER_PRESET_AMOUNTS.map((preset) => (
            <button key={preset} type="button" aria-pressed={amount === String(preset)} aria-label={`KES ${preset.toLocaleString("en-KE")}`}
              onClick={() => {
                setAmount(String(preset));
                document.getElementById("voucher-amount")?.focus();
              }}
              className={`min-h-11 min-w-0 flex-1 rounded-full border px-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${
                amount === String(preset) ? "border-brand-navy bg-brand-navy text-white" : "border-gray-300 text-gray-700 hover:border-brand-navy"
              }`}>
              {preset.toLocaleString("en-KE")}
            </button>
          ))}
        </div>
        {errors.amount && <p id="voucher-amount-error" className={error}>{errors.amount}</p>}
      </div>

      <div>
        <label htmlFor="voucher-senderName" className={label}>Your name</label>
        <input id="voucher-senderName" name="senderName" type="text" autoComplete="name" maxLength={80} required
          aria-invalid={Boolean(errors.senderName)} aria-describedby={errors.senderName ? "voucher-senderName-error" : undefined}
          placeholder="Your name" className={input} />
        {errors.senderName && <p id="voucher-senderName-error" className={error}>{errors.senderName}</p>}
      </div>

      <fieldset className="rounded-lg border border-gray-200 bg-white/50 px-3 pb-3 pt-1 sm:col-span-2">
        <legend className="px-1 text-sm font-semibold text-brand-navy">Recipient details</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="voucher-recipientName" className={label}>Name</label>
            <input id="voucher-recipientName" name="recipientName" type="text" maxLength={80} required
              aria-invalid={Boolean(errors.recipientName)} aria-describedby={errors.recipientName ? "voucher-recipientName-error" : undefined}
              placeholder="Their name" className={input} />
            {errors.recipientName && <p id="voucher-recipientName-error" className={error}>{errors.recipientName}</p>}
          </div>
          <div>
            <label htmlFor="voucher-recipientPhone" className={label}>Phone number</label>
            <input id="voucher-recipientPhone" name="recipientPhone" type="tel" inputMode="tel" autoComplete="off" maxLength={24} required
              aria-invalid={Boolean(errors.recipientPhone)} aria-describedby={errors.recipientPhone ? "voucher-recipientPhone-error" : undefined}
              placeholder="0712 345 678" className={input} />
            {errors.recipientPhone && <p id="voucher-recipientPhone-error" className={error}>{errors.recipientPhone}</p>}
          </div>
          <div>
            <label htmlFor="voucher-recipientEmail" className={label}>Email address</label>
            <input id="voucher-recipientEmail" name="recipientEmail" type="email" inputMode="email" autoCapitalize="none"
              spellCheck={false} autoComplete="off" maxLength={254} required
              aria-invalid={Boolean(errors.recipientEmail)} aria-describedby={errors.recipientEmail ? "voucher-recipientEmail-error" : undefined}
              placeholder="their@email.com" className={input} />
            {errors.recipientEmail && <p id="voucher-recipientEmail-error" className={error}>{errors.recipientEmail}</p>}
          </div>
        </div>
      </fieldset>

      <div className="sm:col-span-2">
        <label htmlFor="voucher-message" className={label}>Personal message <span className="font-normal">(optional)</span></label>
        <textarea id="voucher-message" name="message" rows={2} maxLength={500}
          aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "voucher-message-error" : undefined}
          placeholder="Write a note for the recipient" className={`${input} resize-y`} />
        {errors.message && <p id="voucher-message-error" className={error}>{errors.message}</p>}
      </div>

      <button type="submit"
        className="min-h-12 w-full rounded-lg bg-brand-navy px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-gold hover:text-brand-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold sm:col-span-2">
        Continue to WhatsApp
      </button>
    </form>
  );
}
