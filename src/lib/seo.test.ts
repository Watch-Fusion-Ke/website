import { describe, expect, it } from "vitest";
import {
  breadcrumbJsonLd,
  jsonLdScript,
  organizationJsonLd,
  plainText,
  productJsonLd,
  pageShare,
  productMetadata,
  summarise,
  websiteJsonLd,
} from "@/lib/seo";
import { ADDRESS_LINES, EMAIL, INSTAGRAM_URL, OPENING_HOURS, TIKTOK_URL, WHATSAPP_NUMBER } from "@/lib/contact";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const html =
  "<p>An analogue quartz men's watch with a black dial, a leather band and a day and date display.</p><p>Key features</p><ul><li>Water resistant</li><li>Day and date display</li></ul><p>Specifications</p><ul><li>Case size: 45.1 x 38 x 9.4 mm</li></ul>";

describe("the shop's name", () => {
  it("is written one way, Watch Fusion Kenya", () => {
    expect(SITE_NAME).toBe("Watch Fusion Kenya");
  });
});

describe("plainText", () => {
  it("puts a space between paragraphs, list items and line breaks, so words do not run together", () => {
    const text = plainText(html);
    expect(text).toContain("date display. Key features Water resistant Day and date display Specifications");
    expect(text).not.toMatch(/display\.Key|resistantDay/);
  });

  it("turns HTML entities into the characters they stand for, and squeezes spaces", () => {
    expect(plainText("<p>Men&#39;s &amp; Ladies&#x27; watches&nbsp;&nbsp;in   Nairobi</p>")).toBe("Men's & Ladies' watches in Nairobi");
  });

  it("is empty for nothing at all", () => {
    expect(plainText(null)).toBe("");
    expect(plainText("  <p> </p> ")).toBe("");
  });

  it("keeps a bare less-than or greater-than sign in the text instead of treating it as a tag", () => {
    expect(plainText("Price < 5000 and > 3000, 5 < 6 > 4")).toBe("Price < 5000 and > 3000, 5 < 6 > 4");
    expect(plainText("<p>Under <b>5</b> mm</p>")).toBe("Under 5 mm");
  });

  it("reads the typographic characters Wix editors write, as names or as numbers", () => {
    expect(plainText("It&rsquo;s a &ldquo;dive&rdquo; watch &ndash; 50&deg; &#8217; &#x2019; &hellip;")).toBe("It’s a “dive” watch – 50° ’ ’ …");
    expect(plainText("&#99999999; &bogus;")).toBe("&#99999999; &bogus;");
  });

  it("stays fast on a huge text full of less-than signs", () => {
    const started = Date.now();
    plainText("<".repeat(200000));
    plainText("<a ".repeat(100000));
    expect(Date.now() - started).toBeLessThan(1500);
  });

  it("drops comments and doctype-like tags", () => {
    expect(plainText("a<!-- hidden -->b<!DOCTYPE html>c")).toBe("a b c");
  });

  it("leaves no tags behind, and no script text from a hostile description", () => {
    expect(plainText('<b>Hi</b><img src=x onerror="alert(1)"><br/>there')).toBe("Hi there");
  });
});

describe("summarise", () => {
  it("leaves a short text alone", () => {
    expect(summarise("A short sentence.")).toBe("A short sentence.");
  });

  it("stops at the end of the last whole sentence that fits, so a result never ends mid-spec", () => {
    const text = "An analogue quartz men's watch with a black dial, a leather band and a day and date display. Key features Water resistant Day and date display Analogue, 3 hands (hour, minute, second) Specifications";
    const out = summarise(text);
    expect(out).toBe("An analogue quartz men's watch with a black dial, a leather band and a day and date display.");
    expect(out.length).toBeLessThanOrEqual(155);
  });

  it("falls back to the last whole word with an ellipsis when no sentence ends in time", () => {
    const out = summarise("word ".repeat(80).trim());
    expect(out.length).toBeLessThanOrEqual(156);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/\s…$/);
  });

  it("does not stop at a dot inside a model number or a size", () => {
    const out = summarise("Case size 45.1 x 38 x 9.4 mm and a very long description of the watch that goes on and on without any full stop for a long long time indeed so far and then some more words follow after it too");
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/45\.$/);
  });
});

describe("productMetadata", () => {
  const base = { name: "Casio MTP-V006L-1B Black Dial Leather Strap Men's Watch", slug: "casio-mtp-v006l-1b", description: html, imageUrl: "https://static.wixstatic.com/media/a.png", price: 6000, inStock: true };

  it("uses the title and description the shop wrote in the store for the product", () => {
    const m = productMetadata({ ...base, seoTags: [{ type: "title", children: "Casio MTP-V006L-1B | Black Leather Watch Kenya" }, { type: "meta", props: { name: "description", content: "Buy it in Nairobi." } }] });
    expect(m.title).toEqual({ absolute: "Casio MTP-V006L-1B | Black Leather Watch Kenya" });
    expect(m.description).toBe("Buy it in Nairobi.");
    expect(m.openGraph).toMatchObject({ title: "Casio MTP-V006L-1B | Black Leather Watch Kenya", description: "Buy it in Nairobi." });
  });

  it("makes a clean description from the product's own text when the shop wrote none", () => {
    const m = productMetadata(base);
    expect(m.title).toBe(base.name);
    expect(m.description).toBe("An analogue quartz men's watch with a black dial, a leather band and a day and date display.");
  });

  it("falls back to a plain sentence naming the watch when there is no text at all", () => {
    const m = productMetadata({ ...base, description: "" });
    expect(String(m.description)).toContain(base.name);
    expect(String(m.description)).toContain(SITE_NAME);
  });

  it("has one canonical address on the www site, and a share picture with the product's name as its text", () => {
    const m = productMetadata(base);
    expect(m.alternates?.canonical).toBe(`${SITE_URL}/casio-mtp-v006l-1b`);
    expect(m.openGraph).toMatchObject({ url: `${SITE_URL}/casio-mtp-v006l-1b`, siteName: SITE_NAME, images: [{ url: base.imageUrl, alt: base.name }] });
    expect(m.twitter).toMatchObject({ card: "summary_large_image", images: [base.imageUrl] });
  });

  it("names the shop in the share title the same way as everywhere else", () => {
    const m = productMetadata(base);
    expect((m.openGraph as { title: string }).title).toBe(`${base.name} | ${SITE_NAME}`);
    expect(JSON.stringify(m)).not.toContain("WatchFusion Kenya");
  });

  it("falls back to the site's own picture when the product has none", () => {
    const m = productMetadata({ ...base, imageUrl: null });
    expect(m.openGraph).toMatchObject({ images: [{ url: "/share-image.png" }] });
  });
});

describe("productJsonLd", () => {
  const p = { name: "Casio MTP", slug: "casio-mtp", description: html, imageUrl: "https://img/a.png", imageUrls: ["https://img/a.png", "https://img/b.png"], sku: "MTP-1", brand: "Casio", price: 6000, inStock: true, seoTags: [] };

  it("describes the product with a clean description, its brand, its code and all its photos", () => {
    const ld = productJsonLd(p) as Record<string, any>;
    expect(ld["@type"]).toBe("Product");
    expect(ld.description).toBe("An analogue quartz men's watch with a black dial, a leather band and a day and date display.");
    expect(ld.brand).toEqual({ "@type": "Brand", name: "Casio" });
    expect(ld.sku).toBe("MTP-1");
    expect(ld.image).toEqual(["https://img/a.png", "https://img/b.png"]);
    expect(ld.url).toBe(`${SITE_URL}/casio-mtp`);
  });

  it("gives the offer a price in shillings, whether it is in stock, that it is new, and who sells it", () => {
    const offer = (productJsonLd(p) as Record<string, any>).offers;
    expect(offer).toMatchObject({ "@type": "Offer", price: 6000, priceCurrency: "KES", availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition", url: `${SITE_URL}/casio-mtp` });
    expect(offer.seller).toMatchObject({ "@type": "Organization", name: SITE_NAME });
    expect((productJsonLd({ ...p, inStock: false }) as Record<string, any>).offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("leaves out the offer for a product with no price, which search engines would reject", () => {
    expect(JSON.stringify(productJsonLd({ ...p, price: null }))).not.toContain('"offers"');
    expect((productJsonLd({ ...p, price: 0 }) as Record<string, any>).offers.price).toBe(0);
  });

  it("leaves out what the product does not have, instead of printing empty values", () => {
    const text = JSON.stringify(productJsonLd({ ...p, sku: null, brand: null, imageUrl: null, imageUrls: [] }));
    expect(text).not.toContain('"sku"');
    expect(text).not.toContain('"brand"');
    expect(text).not.toContain('"image"');
  });

  it("uses the shop's own description for the product when the shop wrote one in the store", () => {
    const ld = productJsonLd({ ...p, seoTags: [{ type: "meta", props: { name: "description", content: "From the store." } }] }) as Record<string, any>;
    expect(ld.description).toBe("From the store.");
  });
});

describe("breadcrumbJsonLd", () => {
  it("lists the trail from the home page, in order, with full addresses", () => {
    const ld = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }, { name: "Casio", path: "/shop/casio-watches-kenya" }]) as Record<string, any>;
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement.map((i: any) => [i.position, i.name, i.item])).toEqual([
      [1, "Home", `${SITE_URL}/`],
      [2, "Shop", `${SITE_URL}/shop`],
      [3, "Casio", `${SITE_URL}/shop/casio-watches-kenya`],
    ]);
  });
});

describe("organizationJsonLd", () => {
  const ld = organizationJsonLd() as Record<string, any>;

  it("is the shop, with its name, address, phone, email and pages, from the same details the contact page shows", () => {
    expect(ld["@type"]).toBe("Store");
    expect(ld.name).toBe(SITE_NAME);
    expect(ld.url).toBe(SITE_URL);
    expect(ld.telephone).toBe(`+${WHATSAPP_NUMBER}`);
    expect(ld.email).toBe(EMAIL);
    expect(ld.sameAs).toEqual([INSTAGRAM_URL, TIKTOK_URL]);
    expect(ld.address).toMatchObject({ "@type": "PostalAddress", addressLocality: "Nairobi", addressCountry: "KE" });
    expect(ld.address.streetAddress).toBe("Stanbank House, 5th Floor, Wing B, Shop 46, Moi Avenue");
  });

  it("lists the opening hours the contact page shows: Monday to Friday 8:30 to 19:00, Saturday 10:00 to 19:00, closed Sunday", () => {
    expect(OPENING_HOURS).toEqual([
      { days: "Mon to Fri", hours: "8:30am to 7pm" },
      { days: "Sat", hours: "10am to 7pm" },
      { days: "Sun", hours: "Closed" },
    ]);
    expect(ld.openingHoursSpecification).toEqual([
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:30", closes: "19:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "10:00", closes: "19:00" },
    ]);
  });

  it("still reads the address the contact page holds, so a change there is noticed here", () => {
    expect(ADDRESS_LINES).toEqual(["Stanbank House, 5th Floor, Wing B, Shop 46", "Moi Avenue, Nairobi"]);
  });
});

describe("pageShare", () => {
  it("gives a page its own address in link previews, with the shop's name and picture", () => {
    expect(pageShare("/deals")).toEqual({
      type: "website",
      locale: "en_KE",
      siteName: SITE_NAME,
      url: `${SITE_URL}/deals`,
      images: [{ url: "/share-image.png", width: 1200, height: 630, alt: `${SITE_NAME}: Wear the Moment, Own the Legacy` }],
    });
  });
});

describe("websiteJsonLd", () => {
  it("names the site and tells Google how to search it, through the shop's own search address", () => {
    const ld = websiteJsonLd() as Record<string, any>;
    expect(ld["@type"]).toBe("WebSite");
    expect(ld.url).toBe(SITE_URL);
    expect(ld.potentialAction).toMatchObject({ "@type": "SearchAction", target: { urlTemplate: `${SITE_URL}/shop?name={search_term_string}` }, "query-input": "required name=search_term_string" });
  });
});

describe("jsonLdScript", () => {
  it("cannot be broken out of by a product name that holds a closing script tag", () => {
    const out = jsonLdScript({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});
