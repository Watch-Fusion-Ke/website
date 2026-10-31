import GiftVoucherIntro from "@/components/GiftVoucherIntro";
import GiftVoucherRequestForm from "@/components/GiftVoucherRequestForm";
import { pageShare } from "@/lib/seo";
import { VOUCHER_STEPS } from "@/lib/voucherSteps";

export const metadata = {
  title: "Gift vouchers",
  description: "Request a Watch Fusion Kenya gift voucher for someone special. Share the details, then confirm payment with our team on WhatsApp.",
  alternates: { canonical: "/gift-vouchers" },
  openGraph: pageShare("/gift-vouchers"),
};

export default function GiftVouchersPage() {
  return (
    <main className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64">
      <div className="mx-auto max-w-5xl py-4 md:py-5">
        <h1 className="font-display text-4xl font-bold leading-tight md:text-4xl lg:text-5xl">Gift vouchers</h1>
        <p className="mt-1 text-base text-gray-700 md:text-lg">Let someone choose their own watch. Pick an amount and tell us who it is for.</p>
        <GiftVoucherIntro />

        <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start lg:gap-10">
          <section aria-label="Request a voucher" className="rounded-xl bg-brand-cream p-4">
            <GiftVoucherRequestForm />
          </section>

          <aside aria-labelledby="how-heading" className="hidden lg:block lg:pt-1">
            <h2 id="how-heading" className="font-display text-2xl font-bold">How it works</h2>
            <ol data-voucher-steps className="mt-4 space-y-5">
              {VOUCHER_STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span aria-hidden="true" className="w-4 shrink-0 font-sans text-xl font-bold leading-6 text-brand-navy">{i + 1}</span>
                  <span>
                    <span className="block font-semibold text-brand-navy">{step.title}</span>
                    <span className="block text-sm text-gray-600">{step.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    </main>
  );
}
