import type { Metadata } from "next";
import { ADDRESS_LINES, EMAIL, INSTAGRAM_URL, TIKTOK_URL, WHATSAPP_NUMBER } from "@/lib/contact";
import { seoOf, type SeoTag } from "@/lib/categoryPages";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// What search engines and link previews are told about a page. The shop's own wording from the store (the SEO title and description
// it writes for a product or a category) comes first; anything it has not written is made here, once, the same way everywhere.

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&#x27;": "'", "&apos;": "'", "&nbsp;": " " };

// The words of a piece of HTML as one line of plain text. Paragraphs, list items and line breaks become spaces, so words never run together.
export const plainText = (html: string | null | undefined): string =>
  (html ?? "")
    .replace(/<\/(p|li|ul|ol|div|h[1-6])>|<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39|#x27);/g, (entity) => ENTITIES[entity] ?? entity)
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

export const productJsonLd = (p: ProductSeo): object => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: p.name,
  url: productUrl(p.slug),
  image: p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls : p.imageUrl ? [p.imageUrl] : undefined,
  description: productDescription(p),
  sku: p.sku || undefined,
  brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
  offers: {
    "@type": "Offer",
    url: productUrl(p.slug),
    price: p.price ?? undefined,
    priceCurrency: "KES",
    availability: p.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  },
});

export const breadcrumbJsonLd = (trail: { name: string; path: string }[]): object => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map((step, i) => ({ "@type": "ListItem", position: i + 1, name: step.name, item: `${SITE_URL}${step.path}` })),
});

// The shop, from the same details the Contact page shows. The opening hours below are written out as the schema wants them; a test
// holds them to the hours on the Contact page.
const [street, place] = ADDRESS_LINES;
const [road, city] = place.split(",").map((part) => part.trim());

export const organizationJsonLd = (): object => ({
  "@context": "https://schema.org",
  "@type": "Store",
  "@id": `${SITE_URL}/#store`,
  name: SITE_NAME,
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
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/shop?name={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
});

// The text to put inside a script tag. A "<" is written as its code, so a product name can never close the tag early.
export const jsonLdScript = (data: object): string => JSON.stringify(data).replace(/</g, "\\u003c");
