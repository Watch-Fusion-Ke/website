"use client";

import { useEffect, useRef } from "react";

export default function GiftVoucherIntro() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const mobile = window.matchMedia("(max-width: 1023px)");
    if (mobile.matches) dialog.showModal();
    const closeOnDesktop = () => {
      if (!mobile.matches && dialog.open) dialog.close();
    };
    mobile.addEventListener("change", closeOnDesktop);
    return () => {
      mobile.removeEventListener("change", closeOnDesktop);
      if (dialog.open) dialog.close();
    };
  }, []);

  const start = () => {
    dialogRef.current?.close();
    document.getElementById("voucher-amount")?.focus();
  };

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()}
        className="mt-2 min-h-11 text-sm font-semibold text-brand-navy underline underline-offset-4 decoration-brand-gold decoration-2 lg:hidden">
        How it works
      </button>
      <dialog ref={dialogRef} aria-labelledby="voucher-intro-title"
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border-0 bg-white p-6 text-gray-900 shadow-2xl backdrop:bg-black/65 lg:hidden">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-gold-dark">A gift they can choose</p>
        <h2 id="voucher-intro-title" className="mt-2 font-display text-3xl font-bold">How gift vouchers work</h2>
        <ol className="mt-6 space-y-4">
          <li><span className="font-bold text-brand-gold-dark">01 · Fill in the details</span><p className="mt-1 text-sm text-gray-600">Choose an amount and add your contact details and the recipient&apos;s.</p></li>
          <li><span className="font-bold text-brand-gold-dark">02 · Confirm on WhatsApp</span><p className="mt-1 text-sm text-gray-600">Send us the prepared request. Our team will confirm payment details with you.</p></li>
          <li><span className="font-bold text-brand-gold-dark">03 · We send the gift</span><p className="mt-1 text-sm text-gray-600">After we verify payment, we issue the voucher and email the code and card to the recipient.</p></li>
        </ol>
        <p className="mt-5 border-t border-gray-200 pt-4 text-xs leading-5 text-gray-600">The voucher code is what is checked at checkout or in store.</p>
        <button type="button" onClick={start}
          className="mt-5 min-h-12 w-full rounded-lg bg-brand-navy px-5 py-3 font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold">
          Start my request
        </button>
      </dialog>
    </>
  );
}
