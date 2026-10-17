import Image from "next/image";
import Link from "next/link";
import FooterShopLinks from "@/components/FooterShopLinks";
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

const INSTAGRAM_PATH =
  "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z";
const TIKTOK_PATH =
  "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z";

const heading = "mb-4 text-sm font-semibold uppercase tracking-wider text-white";
const link = "block py-1.5 text-sm text-gray-400 transition-colors hover:text-white";
const newTab = <span className="sr-only"> (opens in a new tab)</span>;
const social =
  "flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-gray-400 transition-colors hover:border-brand-gold hover:text-brand-gold";
const outside = { target: "_blank", rel: "noopener noreferrer" } as const;

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-white/10 bg-black text-gray-400">
      <div className="px-4 py-12 md:px-8 lg:px-16 xl:px-32 2xl:px-64">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/logo.png" alt="Watch Fusion Kenya" width={44} height={44} />
              <span className="text-base font-semibold tracking-wide text-white">Watch Fusion Kenya</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm">Watches and gifts in Nairobi.</p>
            <div className="mt-5 flex gap-3">
              <a href={INSTAGRAM_URL} {...outside} aria-label="Instagram" className={social}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={INSTAGRAM_PATH} />
                </svg>
                {newTab}
              </a>
              <a href={TIKTOK_URL} {...outside} aria-label="TikTok" className={social}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={TIKTOK_PATH} />
                </svg>
                {newTab}
              </a>
            </div>
          </div>

          <nav aria-label="Shop">
            <h2 className={heading}>Shop</h2>
            <FooterShopLinks />
          </nav>

          <nav aria-label="Explore">
            <h2 className={heading}>Explore</h2>
            <ul>
              <li><Link href="/" className={link}>Homepage</Link></li>
              <li><Link href="/shop" className={link}>Shop</Link></li>
              <li><Link href="/deals" className={link}>Deals</Link></li>
              <li><Link href="/contact" className={link}>Contact</Link></li>
            </ul>
          </nav>

          <div className="col-span-2 md:col-span-1">
            <h2 className={heading}>Visit us</h2>
            <address className="text-sm not-italic">
              {ADDRESS_LINES.map((line) => (
                <span key={line} className="block">{line}</span>
              ))}
              <a href={MAP_URL} {...outside} className="mt-1 inline-block py-1 text-white underline underline-offset-4 decoration-brand-gold hover:decoration-white">
                Get directions{newTab}
              </a>
              <dl className="mt-4">
                {OPENING_HOURS.map(({ days, hours }) => (
                  <div key={days} className="flex max-w-[16rem] justify-between gap-4">
                    <dt>{days}</dt>
                    <dd>{hours}</dd>
                  </div>
                ))}
              </dl>
              <span className="mt-4 block">
                <a href={PHONE_TEL} className="block py-1.5 transition-colors hover:text-white">{PHONE_DISPLAY}</a>
                <a href={WHATSAPP_URL} {...outside} className="block py-1.5 transition-colors hover:text-white">WhatsApp{newTab}</a>
                <a href={`mailto:${EMAIL}`} className="block break-all py-1.5 transition-colors hover:text-white">{EMAIL}</a>
              </span>
            </address>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-sm">
          <p>© Watch Fusion Kenya. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
