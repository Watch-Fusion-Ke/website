import Link from "next/link";
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
      <div className="mx-auto max-w-5xl py-10 md:py-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-navy dark:text-brand-gold">A gift they can choose</p>
        <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight md:text-5xl">Gift vouchers</h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-700">
          Give someone the freedom to choose a watch they love. Tell us who it is for and the amount you have in mind.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)] lg:gap-14">
          <section aria-labelledby="request-heading" className="rounded-xl bg-brand-cream p-5 sm:p-8">
            <h2 id="request-heading" className="mb-2 font-display text-2xl font-bold">Request a voucher</h2>
            <p className="mb-7 text-sm text-gray-600">We will confirm the amount and payment details with you before issuing it.</p>
            <GiftVoucherRequestForm />
          </section>

          <aside aria-labelledby="how-heading" className="lg:pt-3">
            <h2 id="how-heading" className="font-display text-2xl font-bold">How it works</h2>
            <ol className="mt-6 space-y-7">
              <li><span className="font-semibold text-brand-gold-dark">01</span><p className="mt-1 font-semibold">Fill in the gift details</p><p className="mt-1 text-sm text-gray-600">Choose an amount and tell us who should receive it.</p></li>
              <li><span className="font-semibold text-brand-gold-dark">02</span><p className="mt-1 font-semibold">Chat with our team</p><p className="mt-1 text-sm text-gray-600">Send the prepared WhatsApp message. We will explain how to pay and confirm your payment.</p></li>
              <li><span className="font-semibold text-brand-gold-dark">03</span><p className="mt-1 font-semibold">We send the voucher</p><p className="mt-1 text-sm text-gray-600">After payment is confirmed, our team issues the code and emails it to the recipient.</p></li>
            </ol>
            <div className="mt-9 border-t border-gray-300 pt-7">
              <h3 className="font-semibold">Using a voucher</h3>
              <p className="mt-2 text-sm text-gray-600">Enter the code at checkout, or bring it to our shop and ask the team to redeem it for your order.</p>
              <Link href="/shop" className="mt-3 inline-block text-sm font-semibold text-brand-navy underline underline-offset-4 decoration-brand-gold decoration-2 dark:text-brand-gold">Browse watches</Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
