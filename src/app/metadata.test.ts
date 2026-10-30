import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("canonical links", () => {
  it("are not set once for the whole site, which would make every page claim to be the home page", () => {
    expect(read("src/app/layout.tsx")).not.toMatch(/canonical/);
  });

  it("name each main page as itself", () => {
    expect(read("src/app/page.tsx")).toMatch(/canonical:\s*["']\/["']/);
    for (const [file, path] of [
      ["src/app/shop/page.tsx", "/shop"],
      ["src/app/deals/page.tsx", "/deals"],
      ["src/app/contact/page.tsx", "/contact"],
    ]) {
      expect(read(file)).toMatch(new RegExp(`canonical:\\s*["']${path}["']`));
    }
  });
});

describe("page titles", () => {
  it("give the shop, deals and contact pages a title and a description of their own", () => {
    for (const file of ["src/app/shop/page.tsx", "src/app/deals/page.tsx", "src/app/contact/page.tsx"]) {
      const source = read(file);
      expect(source).toMatch(/export const metadata|export async function generateMetadata/);
      expect(source).toMatch(/title:\s*["'][^"']+["']/);
      expect(source).toMatch(/description:\s*"[^"]{40,}"/);
    }
  });
});

describe("the picture shown when a link to the shop is shared", () => {
  const layout = read("src/app/layout.tsx");

  it("is a card of its own on the brand navy, not the white-lettered logo, which is invisible on a white link card", () => {
    expect(layout).not.toMatch(/images:\s*\[\s*\{\s*url:\s*"\/logo\.png"/);
    expect(layout).not.toMatch(/images:\s*\["\/logo\.png"\]/);
    expect(layout).toContain('url: "/share-image.png"');
    expect(layout).toContain('images: ["/share-image.png"]');
  });

  it("is the 1200 by 630 size link previews ask for, and the file is that size and a real PNG", () => {
    expect(layout).toMatch(/width:\s*1200,\s*height:\s*630/);
    const png = readFileSync("public/share-image.png");
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });

  it("is a small file, so a chat app does not skip it", () => {
    expect(readFileSync("public/share-image.png").length).toBeLessThan(300_000);
  });
});

describe("the shop's name", () => {
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? files(`${dir}/${e.name}`) : /\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name) ? [`${dir}/${e.name}`] : []
    );

  it("is spelled Watch Fusion Kenya in every title, link preview and structured-data line the site makes", () => {
    // The other spellings live in one place only: the list that tells Google they are the same shop.
    const wrong = files("src").filter((f) => f !== "src/lib/site.ts" && /WatchFusion Kenya|WatchFusionKe/.test(readFileSync(f, "utf8")));
    expect(wrong).toEqual([]);
    expect(read("src/lib/site.ts")).toContain("SITE_ALTERNATE_NAMES");
  });

  it("is written in the page language of Kenya, and the layout leaves each page's own title and description to its link preview", () => {
    const layout = read("src/app/layout.tsx");
    expect(layout).toContain('<html lang="en-KE"');
    const share = layout.slice(layout.indexOf("openGraph:"), layout.indexOf("robots:"));
    expect(share).not.toMatch(/title:|description:/);
    expect(share).toContain("siteName: SITE_NAME");
  });
});

describe("structured data", () => {
  it("tells search engines about the shop and its search from the home page, once", () => {
    const home = read("src/app/page.tsx");
    expect(home).toContain("organizationJsonLd");
    expect(home).toContain("websiteJsonLd");
    expect(home).toContain("jsonLdScript");
  });

  it("describes each product with a clean description, a trail of links and the shop's own wording from the store", () => {
    const page = read("src/app/[slug]/page.tsx");
    expect(page).toContain("productMetadata");
    expect(page).toContain("productJsonLd");
    expect(page).toContain("breadcrumbJsonLd");
    expect(page).toContain("jsonLdScript");
    expect(page).not.toMatch(/replace\(\/<\[\^>\]\*>\/g/);
    expect(page).toContain("seoData");
  });

  it("gives the Shop, Deals and Contact pages their own address in link previews, not the home page's", () => {
    for (const [file, path] of [["src/app/shop/page.tsx", "/shop"], ["src/app/deals/page.tsx", "/deals"], ["src/app/contact/page.tsx", "/contact"]]) {
      expect(read(file)).toContain(`pageShare("${path}")`);
    }
  });

  it("gives the product photo the product's name as its text", () => {
    expect(read("src/app/[slug]/page.tsx")).toMatch(/<ProductImages[^>]*name=\{product\.name/);
  });
});

describe("the home page's title and description", () => {
  const layout = read("src/app/layout.tsx");

  it("are the wording the shop asked for: authentic watches in Nairobi, free delivery on orders above Ksh 10,000", () => {
    expect(layout).toContain("default: `Authentic Watches in Nairobi Kenya | Free Deliveries on Orders above Ksh 10,000`");
    expect(layout).toContain(
      "`Shop authentic watches and premium gift packages at ${SITE_NAME}. Personalize your gift with custom engraving and enjoy same-day delivery and FREE delivery on orders above KSh 10,000.`"
    );
  });

  it("no longer use the old wording", () => {
    expect(layout).not.toContain("Premium Watches in Nairobi");
    expect(layout).not.toContain("Shop premium watches in Kenya");
  });

  it("list the words people search for: the shop's brands, gifts, engraving and delivery, with Nairobi and Kenya", () => {
    const layout = read("src/app/layout.tsx");
    const keywords = layout.slice(layout.indexOf("keywords: ["), layout.indexOf("authors:"));
    for (const term of ["Casio watches Nairobi", "Naviforce watches Kenya", "gift packages Nairobi", "corporate gifts Nairobi", "custom engraved watch Kenya", "same day delivery Nairobi", "original watches Nairobi", "watch shop Nairobi"]) {
      expect(keywords).toContain(term);
    }
  });

  it("promise the delivery the cart gives: free from Ksh 10,000, which the code states as 10,000", async () => {
    const { FREE_DELIVERY_FROM } = await import("@/lib/delivery");
    expect(FREE_DELIVERY_FROM).toBe(10000);
  });
});
