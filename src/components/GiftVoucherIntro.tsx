"use client";

import { useEffect, useRef } from "react";
import { introSeen, markIntroSeen } from "@/lib/voucherIntro";

export default function GiftVoucherIntro() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const mobile = window.matchMedia("(max-width: 1023px)");
    const storage = (() => {
      try {
        return window.localStorage;
      } catch {
        return null;
      }
    })();
    // Opens by itself on a phone until the shopper has dismissed it once. A returning visitor goes straight to the form; "How it works"
    // opens it again. It counts as seen only when the shopper dismisses it, never when it opens, so closing it on their behalf (as
    // the page does when the screen widens, or when a second effect run tidies up in development) does not lose it.
    if (mobile.matches && !introSeen(storage)) dialog.showModal();
    const closeOnDesktop = () => {
      if (!mobile.matches && dialog.open) dialog.close();
    };
    mobile.addEventListener("change", closeOnDesktop);
    return () => {
      mobile.removeEventListener("change", closeOnDesktop);
      if (dialog.open) dialog.close();
    };
  }, []);

  const remember = () => {
    try {
      markIntroSeen(window.localStorage);
    } catch {
      // storage blocked: it will simply show again next time
    }
  };

  const start = () => {
    remember();
    dialogRef.current?.close();
    document.getElementById("voucher-amount")?.focus();
  };

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()}
        className="mt-2 min-h-11 text-sm font-semibold text-brand-navy underline underline-offset-4 decoration-brand-gold decoration-2 lg:hidden">
        How it works
      </button>
      <dialog ref={dialogRef} aria-labelledby="voucher-intro-title" onCancel={remember}
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border-0 bg-white p-6 text-gray-900 shadow-2xl backdrop:bg-black/65 lg:hidden">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-navy">A gift they can choose</p>
        <h2 id="voucher-intro-title" className="mt-2 font-display text-3xl font-bold">How gift vouchers work</h2>
        <ol className="mt-6 space-y-4">
          <li><span className="font-bold text-brand-navy">01 · Fill in the details</span><p className="mt-1 text-sm text-gray-600">Choose an amount, add your name and the gift recipient&apos;s details.</p></li>
          <li><span className="font-bold text-brand-navy">02 · Confirm on WhatsApp</span><p className="mt-1 text-sm text-gray-600">Send us the prepared request. Our team will confirm payment details with you.</p></li>
          <li><span className="font-bold text-brand-navy">03 · We send the gift</span><p className="mt-1 text-sm text-gray-600">After we verify payment, we issue the voucher and email the code to the recipient.</p></li>
        </ol>
        <p className="mt-5 border-t border-gray-200 pt-4 text-xs leading-5 text-gray-600">Every voucher is a unique code held in our records, with its own balance. A picture or screenshot of a voucher cannot be used without the code.</p>
        <button type="button" onClick={start}
          className="mt-5 min-h-12 w-full rounded-lg bg-brand-navy px-5 py-3 font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold">
          Start my request
        </button>
      </dialog>
    </>
  );
}
