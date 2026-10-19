import { MetadataRoute } from "next";
import { wixClientServer } from "@/lib/wixClientServer";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/deals`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Every product, page by page. A product with no slug has no page, and an address is listed once.
  const productPages: MetadataRoute.Sitemap = [];
  try {
    const wixClient = await wixClientServer();
    const seen = new Set<string>();
    let page = await wixClient.products.queryProducts().limit(100).find();
    for (let pages = 0; pages < 20; pages++) {
      for (const product of page.items) {
        if (!product.slug || seen.has(product.slug)) continue;
        seen.add(product.slug);
        productPages.push({
          url: `${BASE_URL}/${product.slug}`,
          lastModified: product.lastUpdated ? new Date(product.lastUpdated) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        });
      }
      if (!page.hasNext()) break;
      page = await page.next();
    }
  } catch (error) {
    console.error("Error generating product sitemap:", error);
  }

  return [...staticPages, ...productPages];
}
