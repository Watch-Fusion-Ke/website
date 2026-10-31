import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { SITE_NAME } from "@/lib/site";
import ShopListing from "@/components/ShopListing";
import { getCategoryPages } from "@/lib/categoryData";
import {
  ALL_PRODUCTS_SLUG,
  categoryDescription,
  categoryHref,
  categoryTitle,
  findCategory,
  hasFilters,
  legacyCategoryTarget,
  retiredCategoryTarget,
  type CategoryPage,
} from "@/lib/categoryPages";

type Params = { [key: string]: string | string[] | undefined };
type Props = { params: Promise<{ category: string }>; searchParams: Promise<Params> };

const slugOf = (raw: string): string => {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

// Each category has an address of its own, a title and description from the store, and one canonical address.
// A search or filter on it is not a page to rank, so those are kept out of search results.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const slug = slugOf((await params).category);
  const robots = hasFilters(await searchParams) ? { robots: { index: false, follow: true } } : {};

  let category: CategoryPage | undefined;
  try {
    category = findCategory(await getCategoryPages(), slug);
  } catch {
    return { title: "Shop", ...robots };
  }
  if (!category) return { title: "Category not found", robots: { index: false, follow: false } };

  const href = categoryHref(category.slug);
  const title = categoryTitle(category);
  const description = categoryDescription(category);
  return {
    title,
    description,
    alternates: { canonical: href },
    // A page's own openGraph replaces the site's whole one, so what a link preview needs from it is repeated here.
    openGraph: {
      type: "website",
      locale: "en_KE",
      siteName: SITE_NAME,
      title: typeof title === "string" ? title : title.absolute,
      description,
      url: href,
      images: [{ url: "/share-image.png", width: 1200, height: 630, alt: `${SITE_NAME}: Wear the Moment, Own the Legacy` }],
    },
    ...robots,
  };
}

export default async function CategoryPageRoute({ params, searchParams }: Props) {
  const slug = slugOf((await params).category);
  const query = await searchParams;

  // The store's own All Products category is the whole shop.
  if (slug === ALL_PRODUCTS_SLUG) permanentRedirect(legacyCategoryTarget({ ...query, cat: ALL_PRODUCTS_SLUG }) ?? "/shop");

  // If the store cannot be read this throws, so the page fails instead of claiming the category does not exist.
  const categories = await getCategoryPages();
  const category = findCategory(categories, slug);
  if (!category) {
    const moved = retiredCategoryTarget(slug);
    if (moved) permanentRedirect(moved);
    notFound();
  }

  // Called as a function, not used as a tag, so the page is one finished tree and a test can render it.
  return ShopListing({ category, categories, searchParams: query });
}
