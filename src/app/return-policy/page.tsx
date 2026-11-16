import Link from "next/link";
import { pageShare } from "@/lib/seo";
import {
  ADDRESS_LINES,
  EMAIL,
  PHONE_DISPLAY,
  PHONE_TEL,
  WHATSAPP_URL,
} from "@/lib/contact";

export const metadata = {
  title: "Returns & Exchanges Policy",
  description:
    "How to request a watch exchange from Watch Fusion Kenya within 48 hours, including delivery costs and replacement prices.",
  alternates: { canonical: "/return-policy" },
  openGraph: pageShare("/return-policy"),
};

const link =
  "font-medium text-brand-navy underline decoration-brand-gold decoration-2 underline-offset-4 hover:decoration-brand-navy";

export default function ReturnPolicyPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 md:px-8 md:py-16">
      <div className="max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-navy">
          Watch Fusion Kenya
        </p>
        <h1 className="font-display text-4xl font-bold md:text-5xl">Returns &amp; exchanges policy</h1>
        <p className="mt-5 text-lg leading-relaxed text-gray-700">
          If the watch you bought does not feel right for you, contact us within 48 hours of receiving
          your delivery or making your in-store purchase. We can arrange an exchange for another item.
        </p>
      </div>

      <section aria-label="Policy at a glance" className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-brand-cream p-5">
          <p className="font-display text-3xl font-bold text-brand-navy">48 hours</p>
          <p className="mt-1 text-sm text-gray-700">Contact us to request an exchange. The item can be returned afterward.</p>
        </div>
        <div className="rounded-xl bg-brand-cream p-5">
          <p className="font-display text-3xl font-bold text-brand-navy">Watches only</p>
          <p className="mt-1 text-sm text-gray-700">This exchange policy applies to watches.</p>
        </div>
        <div className="rounded-xl bg-brand-cream p-5">
          <p className="font-display text-3xl font-bold text-brand-navy">Exchange</p>
          <p className="mt-1 text-sm text-gray-700">Choose another product. We do not offer refunds for these exchanges.</p>
        </div>
      </section>

      <section aria-labelledby="eligibility" className="mt-14 max-w-3xl">
        <h2 id="eligibility" className="font-display text-3xl font-bold">Which watches can be exchanged?</h2>
        <p className="mt-4 leading-relaxed text-gray-700">
          This policy covers watches, including one that is not the size or weight you expected.
          You may try the watch on. To be eligible for a change-of-mind exchange, it must be
          undamaged and returned complete with the box and accessories supplied with it.
        </p>
      </section>

      <section aria-labelledby="how-it-works" className="mt-14 max-w-3xl">
        <h2 id="how-it-works" className="font-display text-3xl font-bold">How an exchange works</h2>
        <ol className="mt-6 space-y-6 text-gray-700">
          <li>
            <h3 className="font-semibold text-gray-900">1. Get in touch within 48 hours</h3>
            <p className="mt-1 leading-relaxed">
              Tell us your order details and why you would like to exchange the watch. The 48-hour
              deadline is for contacting us; we will arrange the return with you afterward.
            </p>
          </li>
          <li>
            <h3 className="font-semibold text-gray-900">2. Choose another product</h3>
            <p className="mt-1 leading-relaxed">
              You can exchange for a higher-priced product by paying the difference. You can also
              choose a lower-priced product, but we do not refund the price difference.
            </p>
          </li>
          <li>
            <h3 className="font-semibold text-gray-900">3. Arrange delivery</h3>
            <p className="mt-1 leading-relaxed">
              You can bring the watch to our shop or arrange delivery back to us. If delivery is
              used, you pay the cost of sending the watch back and the delivery cost of the exchange
              item to you. We will confirm those costs when arranging your exchange.
            </p>
          </li>
        </ol>
      </section>

      <section aria-labelledby="faults" className="mt-14 max-w-3xl">
        <h2 id="faults" className="font-display text-3xl font-bold">Faulty or incorrect watches</h2>
        <p className="mt-4 leading-relaxed text-gray-700">
          If the watch arrives faulty or is not the one you ordered, contact us within 48 hours of
          receiving it (or buying it in store) so we can arrange an exchange. The same delivery
          arrangements above apply.
        </p>
        <p className="mt-4 leading-relaxed text-gray-700">
          If a fault appears later, you can still contact us about the watch&apos;s warranty. We will
          check the warranty supplied with your watch and help you with the next steps. This policy
          does not limit your rights under applicable consumer law.
        </p>
      </section>

      <section aria-labelledby="contact-us" className="mt-14 rounded-xl bg-brand-cream p-6 md:p-8">
        <h2 id="contact-us" className="font-display text-3xl font-bold">Contact us about an exchange</h2>
        <p className="mt-2 text-gray-700">Please contact us before sending a watch back.</p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
          <a href={WHATSAPP_URL} className={link}>WhatsApp</a>
          <a href={PHONE_TEL} className={link}>Call {PHONE_DISPLAY}</a>
          <a href={`mailto:${EMAIL}`} className={link}>{EMAIL}</a>
          <Link href="/contact" className={link}>Website contact form</Link>
        </div>
        <address className="mt-6 text-sm not-italic text-gray-700">
          {ADDRESS_LINES.map((line) => <span key={line} className="block">{line}</span>)}
        </address>
      </section>
    </main>
  );
}
