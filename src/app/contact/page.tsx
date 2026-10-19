import ContactForm from "@/components/ContactForm";
import { ChatIcon, ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from "@/components/icons";
import {
    ADDRESS_LINES,
    EMAIL,
    INSTAGRAM_URL,
    MAP_URL,
    OPENING_HOURS,
    PHONE_DISPLAY,
    PHONE_TEL,
    TIKTOK_URL,
    WHATSAPP_URL,
} from "@/lib/contact";

export const metadata = {
    title: "Contact",
    description: "Find Watch Fusion Kenya in Nairobi, see the opening hours, and chat with us on WhatsApp, by phone or by email.",
    alternates: { canonical: "/contact" },
};

const card = "rounded-xl bg-brand-cream p-6";
const link = "font-medium text-brand-navy underline underline-offset-4 decoration-brand-gold decoration-2 hover:decoration-brand-navy";
const outside = { target: "_blank", rel: "noopener noreferrer" } as const;

export default function ContactPage() {
    return (
        <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64">
            <section className="py-12 text-center">
                <h1 className="font-display text-4xl font-bold md:text-5xl mb-4">Get in touch</h1>
                <p className="mx-auto max-w-2xl text-lg text-gray-600">
                    Questions about a watch, an order or delivery? The quickest way to reach us is WhatsApp.
                </p>
                <a
                    href={WHATSAPP_URL}
                    {...outside}
                    className="mt-8 inline-block rounded-lg bg-brand-navy px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-gold hover:text-brand-navy"
                >
                    Chat on WhatsApp
                </a>
            </section>

            <section className="mx-auto max-w-2xl py-4">
                <div className={card}>
                    <h2 className="mb-1 font-display text-2xl font-bold">Send us a message</h2>
                    <p className="mb-6 text-sm text-gray-600">We reply by email. For a quicker answer, use WhatsApp.</p>
                    <ContactForm />
                </div>
            </section>

            <section className="grid gap-6 py-8 md:grid-cols-2">
                <div className={card}>
                    <PhoneIcon className="mb-3 h-8 w-8 text-brand-navy" />
                    <h2 className="mb-2 text-lg font-semibold">Call or WhatsApp</h2>
                    <p className="flex flex-wrap gap-x-6 gap-y-1 text-gray-700">
                        <a href={PHONE_TEL} className={link}>{PHONE_DISPLAY}</a>
                        <a href={WHATSAPP_URL} {...outside} className={link}>WhatsApp</a>
                    </p>
                </div>

                <div className={card}>
                    <MailIcon className="mb-3 h-8 w-8 text-brand-navy" />
                    <h2 className="mb-2 text-lg font-semibold">Email</h2>
                    <p className="text-gray-700">
                        <a href={`mailto:${EMAIL}`} className={link}>{EMAIL}</a>
                    </p>
                </div>

                <div className={card}>
                    <MapPinIcon className="mb-3 h-8 w-8 text-brand-navy" />
                    <h2 className="mb-2 text-lg font-semibold">Visit the shop</h2>
                    <p className="text-gray-700">
                        {ADDRESS_LINES.map((line) => (
                            <span key={line} className="block">{line}</span>
                        ))}
                    </p>
                    <p className="mt-3">
                        <a href={MAP_URL} {...outside} className={link}>Get directions</a>
                    </p>
                </div>

                <div className={card}>
                    <ClockIcon className="mb-3 h-8 w-8 text-brand-navy" />
                    <h2 className="mb-2 text-lg font-semibold">Opening hours</h2>
                    <dl className="text-gray-700">
                        {OPENING_HOURS.map(({ days, hours }) => (
                            <div key={days} className="flex justify-between gap-6 max-w-xs">
                                <dt>{days}</dt>
                                <dd>{hours}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <div className={card}>
                    <ChatIcon className="mb-3 h-8 w-8 text-brand-navy" />
                    <h2 className="mb-2 text-lg font-semibold">Follow us</h2>
                    <p className="flex gap-6 text-gray-700">
                        <a href={INSTAGRAM_URL} {...outside} className={link}>Instagram</a>
                        <a href={TIKTOK_URL} {...outside} className={link}>TikTok</a>
                    </p>
                </div>
            </section>

            <section className="py-12">
                <h2 className="mb-8 text-center font-display text-3xl font-bold">Common questions</h2>
                <div className="mx-auto max-w-3xl space-y-4">
                    <details className="rounded-lg bg-brand-cream p-6">
                        <summary className="cursor-pointer text-lg font-semibold">Is delivery free?</summary>
                        <p className="mt-3 text-gray-700">
                            No, delivery is not free. The fee depends on where in Nairobi you are.
                        </p>
                    </details>
                    <details className="rounded-lg bg-brand-cream p-6">
                        <summary className="cursor-pointer text-lg font-semibold">Can I come and see the watches?</summary>
                        <p className="mt-3 text-gray-700">
                            Yes. Visit us at Stanbank House on Moi Avenue during the opening hours above.
                        </p>
                    </details>
                    <details className="rounded-lg bg-brand-cream p-6">
                        <summary className="cursor-pointer text-lg font-semibold">What about delivery outside Nairobi?</summary>
                        <p className="mt-3 text-gray-700">
                            Message us on WhatsApp with your location and we will tell you what is possible.
                        </p>
                    </details>
                </div>
            </section>
        </div>
    );
}
