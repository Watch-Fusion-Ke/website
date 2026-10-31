import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import ShopListing from "@/components/ShopListing";
import { getCategoryPages } from "@/lib/categoryData";
import { pageShare } from "@/lib/seo";
import { hasFilters, legacyCategoryTarget, type CategoryPage } from "@/lib/categoryPages";

type Params = { [key: string]: string | string[] | undefined };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
    const params = await searchParams;
    return {
        title: "Shop watches",
        description: "Browse men's and ladies' watches and gifts from Watch Fusion Kenya, with delivery across Nairobi and Kenya.",
        alternates: { canonical: "/shop" },
        openGraph: pageShare("/shop"),
        // A search or a filtered list is not a page to rank: the plain shop is.
        ...(hasFilters(params) ? { robots: { index: false, follow: true } } : {}),
    };
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<Params> }) {
    const params = await searchParams;

    // The old address of a category, /shop?cat=<slug>, lives at /shop/<slug> now.
    const moved = legacyCategoryTarget(params);
    if (moved) permanentRedirect(moved);

    let categories: CategoryPage[] = [];
    try {
        categories = await getCategoryPages();
    } catch (e) {
        console.error("ShopPage: category list failed", e);
    }

    // Called as a function, not used as a tag, so the page is one finished tree and a test can render it.
    return ShopListing({ category: null, categories, searchParams: params });
}
