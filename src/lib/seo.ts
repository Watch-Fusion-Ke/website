import type { Metadata } from "next";
import { ADDRESS_LINES, EMAIL, INSTAGRAM_URL, TIKTOK_URL, WHATSAPP_NUMBER } from "@/lib/contact";
import { seoOf, type SeoTag } from "@/lib/categoryPages";
import { SITE_ALTERNATE_NAMES, SITE_NAME, SITE_URL } from "@/lib/site";

// What search engines and link previews are told about a page. The shop's own wording from the store (the SEO title and description
// it writes for a product or a category) comes first; anything it has not written is made here, once, the same way everywhere.

// The named entities an editor is likely to produce. Numbers (&#8217; and &#x2019;) are read separately.
const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…",
  deg: "°", pound: "£", times: "×", reg: "®", copy: "©", trade: "™",
};

const decodeEntities = (text: string): string =>
  text.replace(/&(?:#(\d{1,6})|#x([0-9a-f]{1,6})|([a-z]{2,8}));/gi, (whole, dec, hex, name) => {
    if (name) return NAMED[String(name).toLowerCase()] ?? whole;
    const code = dec ? parseInt(dec, 10) : parseInt(hex, 16);
    return code > 0 && code <= 0xffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCharCode(code) : whole;
  });

// The words of a piece of HTML as one line of plain text. Paragraphs, list items and line breaks become spaces, so words never run together.
export const plainText = (html: string | null | undefined): string =>
  decodeEntities(
    (html ?? "")
      .replace(/<\/(p|li|ul|ol|div|h[1-6])>|<br\s*\/?>/gi, " ")
      // A tag starts with "<" and a letter (or "/", "!", "?") and ends at the next ">" with no "<" between, so a bare "<" in a sentence
      // stays text, and the scan can never run on past the next "<".
      .replace(/<[/!?]?[a-zA-Z][^<>]*>|<![^<>]*>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();

const MAX_DESCRIPTION = 155;
const SHORTEST_SENTENCE = 60;

// A line short enough for a search result: the last whole sentence that fits, or else the last whole word with an ellipsis.
export const summarise = (text: string, max = MAX_DESCRIPTION): string => {
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  let end = -1;
  for (const mark of [". ", "! ", "? "]) end = Math.max(end, head.lastIndexOf(mark));
  if (end >= SHORTEST_SENTENCE) return head.slice(0, end + 1);
  const words = head.slice(0, head.lastIndexOf(" ")).replace(/[\s,;:.\-–]+$/, "");
  return `${words}…`;
};

export type ProductSeo = {
  name: string;
  slug: string;
  description?: string | null;
  seoTags?: SeoTag[];
  imageUrl?: string | null;
  imageUrls?: string[];
  sku?: string | null;
  brand?: string | null;
  price?: number | null;
  inStock?: boolean;
};

// The brands the shop sells. Many products have no brand entered in the store, but their names start with it.
const BRANDS = ["Casio", "Naviforce", "Curren", "Poedagar", "Olevs", "Hannah Martin", "Reward", "Crrju"];

export const brandOf = (name: string, brand?: string | null): string | undefined => {
  const entered = brand?.trim();
  if (entered) return entered;
  const start = name.trim().toLowerCase();
  return BRANDS.find((b) => {
    const lower = b.toLowerCase();
    return start === lower || start.startsWith(`${lower} `);
  });
};

const productUrl = (slug: string) => `${SITE_URL}/${slug}`;

const productDescription = (p: ProductSeo): string => {
  const seo = seoOf(p.seoTags);
  return seo.description || summarise(plainText(p.description)) || `Buy ${p.name} at ${SITE_NAME}. Genuine watches with delivery across Nairobi and Kenya.`;
};

export const productMetadata = (p: ProductSeo): Metadata => {
  const seo = seoOf(p.seoTags);
  const description = productDescription(p);
  const shareTitle = seo.title ?? `${p.name} | ${SITE_NAME}`;
  const image = p.imageUrl ? { url: p.imageUrl, alt: p.name } : { url: "/share-image.png", alt: `${SITE_NAME}: Wear the Moment, Own the Legacy` };
  return {
    title: seo.title ? { absolute: seo.title } : p.name,
    description,
    alternates: { canonical: productUrl(p.slug) },
    openGraph: { type: "website", locale: "en_KE", siteName: SITE_NAME, title: shareTitle, description, url: productUrl(p.slug), images: [image] },
    twitter: { card: "summary_large_image", title: shareTitle, description, images: [image.url] },
  };
};

export const productJsonLd = (p: ProductSeo): object => {
  const brand = brandOf(p.name, p.brand);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    url: productUrl(p.slug),
    image: p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls : p.imageUrl ? [p.imageUrl] : undefined,
    description: productDescription(p),
    sku: p.sku || undefined,
    brand: brand ? { "@type": "Brand", name: brand } : undefined,
    // An offer with no price is rejected by search engines, so a product with no price has none.
    offers:
      p.price == null
        ? undefined
        : {
            "@type": "Offer",
            url: productUrl(p.slug),
            price: p.price,
            priceCurrency: "KES",
            availability: p.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
          },
  };
};

// What a page tells link previews about itself: its own address, the shop's name and the share picture. The page's own title and
// description are filled in by Next. (A page that sets this replaces the layout's, so each one asks for it.)
export const pageShare = (path: string) => ({
  type: "website" as const,
  locale: "en_KE",
  siteName: SITE_NAME,
  url: `${SITE_URL}${path}`,
  images: [{ url: "/share-image.png", width: 1200, height: 630, alt: `${SITE_NAME}: Wear the Moment, Own the Legacy` }],
});

export const breadcrumbJsonLd = (trail: { name: string; path: string }[]): object => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map((step, i) => ({ "@type": "ListItem", position: i + 1, name: step.name, item: `${SITE_URL}${step.path}` })),
});

// The shop, from the same details the Contact page shows. The opening hours below are written out as the schema wants them; a test
// holds them to the hours on the Contact page.
const [street = "", place = ""] = ADDRESS_LINES;
const [road = "", city = "Nairobi"] = place.split(",").map((part) => part.trim());

export const organizationJsonLd = (): object => ({
  "@context": "https://schema.org",
  "@type": "Store",
  "@id": `${SITE_URL}/#store`,
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAMES,
  url: SITE_URL,
  image: `${SITE_URL}/share-image.png`,
  logo: `${SITE_URL}/apple-icon.png`,
  description: "Premium watches and watch gifts in Nairobi, with delivery across Kenya.",
  telephone: `+${WHATSAPP_NUMBER}`,
  email: EMAIL,
  currenciesAccepted: "KES",
  address: { "@type": "PostalAddress", streetAddress: `${street}, ${road}`, addressLocality: city, addressCountry: "KE" },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:30", closes: "19:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "10:00", closes: "19:00" },
  ],
  sameAs: [INSTAGRAM_URL, TIKTOK_URL],
});

export const websiteJsonLd = (): object => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAMES,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/shop?name={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
});

// The text to put inside a script tag. A "<" is written as its code, so a product name can never close the tag early.
export const jsonLdScript = (data: object): string => JSON.stringify(data).replace(/</g, "\\u003c");
