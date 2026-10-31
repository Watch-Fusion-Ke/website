import Link from "next/link";
import GiftVoucherIntro from "@/components/GiftVoucherIntro";
import GiftVoucherRequestForm from "@/components/GiftVoucherRequestForm";
import { pageShare } from "@/lib/seo";

export const metadata = {
  title: "Gift vouchers",
  description: "Request a Watch Fusion Kenya gift voucher for someone special. Share the details, then confirm payment with our team on WhatsApp.",
  alternates: { canonical: "/gift-vouchers" },
  openGraph: pageShare("/gift-vouchers"),
};

export default function GiftVouchersPage() {
  return (
    <main className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64">
      <div className="mx-auto max-w-6xl py-6 md:py-8 lg:py-4">
        <div className="lg:flex lg:items-end lg:justify-between lg:gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy dark:text-brand-gold">A gift they can choose</p>
            <h1 className="mt-1 font-display text-4xl font-bold leading-tight md:text-5xl">Gift vouchers</h1>
          </div>
          <p className="mt-2 max-w-2xl text-base text-gray-700 lg:mt-0 lg:max-w-lg lg:text-right">
            Give someone the freedom to choose a watch they love. Tell us who it is for and the amount you have in mind.
          </p>
        </div>
        <GiftVoucherIntro />

        <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(15rem,0.7fr)] lg:gap-10">
          <section aria-labelledby="request-heading" className="rounded-xl bg-brand-cream p-4 sm:p-5 lg:p-4">
            <h2 id="request-heading" className="font-display text-2xl font-bold">Request a voucher</h2>
            <p className="mb-3 mt-1 text-sm text-gray-600">Review the prepared WhatsApp message. We confirm payment before issuing.</p>
            <GiftVoucherRequestForm />
          </section>

          <aside aria-labelledby="how-heading" className="hidden lg:block lg:pt-2">
            <h2 id="how-heading" className="font-display text-2xl font-bold">How it works</h2>
            <ol className="mt-4 space-y-4">
              <li><span className="font-semibold text-brand-navy">01 · Fill in the details</span><p className="mt-1 text-sm text-gray-600">Choose an amount, add your name and the gift recipient&apos;s details.</p></li>
              <li><span className="font-semibold text-brand-navy">02 · Chat with our team</span><p className="mt-1 text-sm text-gray-600">Send the WhatsApp request. We explain how to pay and confirm your payment.</p></li>
              <li><span className="font-semibold text-brand-navy">03 · We send the voucher</span><p className="mt-1 text-sm text-gray-600">After payment is verified, we issue the code and email it to the recipient.</p></li>
            </ol>
            <div className="mt-5 border-t border-gray-300 pt-4">
              <h3 className="font-semibold">Using a voucher</h3>
              <p className="mt-1 text-sm text-gray-600">Enter the code at checkout, or ask our shop team to redeem it for your order. Every voucher is a unique code held in our records, with its own balance, so a picture or screenshot of a voucher cannot be used without the code.</p>
              <Link href="/shop" className="mt-2 inline-block text-sm font-semibold text-brand-navy underline underline-offset-4 decoration-brand-gold decoration-2 dark:text-brand-gold">Browse watches</Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
