import ProductList from "@/components/ProductList";
import Filter from "@/components/Filter";
import { wixClientServer } from "@/lib/wixClientServer";
import { getPriceBounds } from "@/lib/storeProducts";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
    title: "Shop watches",
    description: "Browse men's and ladies' watches and gifts from Watch Fusion Kenya, with delivery across Nairobi and Kenya.",
    alternates: { canonical: "/shop" },
};

// The store's own "All Products" category is the whole shop, which the first chip already is.
const isAllProducts = (slug?: string) => slug === "all-products";

export default async function ShopPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const catSlug = typeof resolvedParams.cat === "string" ? resolvedParams.cat : "";

    const wixClient = await wixClientServer();
    const bounds = await getPriceBounds((url, init) => wixClient.fetchWithAuth(url, init));

    let categoryId = "";
    let categoryName = "";
    let unknownCategory = false;
    if (catSlug && !isAllProducts(catSlug)) {
        try {
            const cat = await wixClient.collections.getCollectionBySlug(catSlug);
            categoryId = cat.collection?._id || "";
            categoryName = cat.collection?.name || "";
        } catch {
            // Unknown category: show the whole shop and say so.
        }
        unknownCategory = categoryId === "";
    }

    // The chips come from the store's real categories, so none of them is a dead link.
    let chips: { name: string; slug: string }[] = [];
    try {
        const cats = await wixClient.collections.queryCollections().find();
        chips = cats.items
            .filter((c) => c.name && c.slug && !isAllProducts(c.slug))
            .map((c) => ({ name: c.name as string, slug: c.slug as string }));
    } catch (e) {
        console.error("ShopPage: category list failed", e);
    }

    const chip = (active: boolean) =>
        `flex-shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors ${
            active
                ? "bg-brand-navy text-white"
                : "bg-gray-100 text-gray-700 hover:bg-brand-gold hover:text-brand-navy"
        }`;

    return (
        <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 relative">
            <div className="pt-8 pb-6">
                <h1 className="font-display text-4xl font-bold md:text-5xl mb-2">
                    {categoryName || "Shop all products"}
                </h1>
                <p className="text-gray-600">
                    {categoryName ? `Browse our ${categoryName} collection` : "Browse our complete collection"}
                </p>
            </div>

            {unknownCategory && (
                <p role="status" className="mb-4 rounded-lg bg-brand-cream px-4 py-3 text-sm text-gray-700">
                    We could not find that category, so here is everything.
                </p>
            )}

            <nav aria-label="Categories" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide md:mx-0 md:flex-wrap md:px-0">
                <Link
                    href="/shop"
                    aria-current={categoryId === "" ? "page" : undefined}
                    className={chip(categoryId === "")}
                >
                    All products
                </Link>
                {chips.map((c) => (
                    <Link
                        key={c.slug}
                        href={`/shop?cat=${c.slug}`}
                        aria-current={catSlug === c.slug && categoryId !== "" ? "page" : undefined}
                        className={chip(catSlug === c.slug && categoryId !== "")}
                    >
                        {c.name}
                    </Link>
                ))}
            </nav>

            <div className="mt-6 border-y border-gray-200 py-5">
                <Suspense fallback={<div className="h-16" />}>
                    <Filter bounds={bounds} />
                </Suspense>
            </div>

            <div className="pb-8">
                <Suspense fallback={<ProductListSkeleton />}>
                    <ProductList categoryId={categoryId} searchParams={resolvedParams} />
                </Suspense>
            </div>
        </div>
    );
}

function ProductListSkeleton() {
    return (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col gap-4">
                    <div className="aspect-square w-full animate-pulse rounded-md bg-gray-200 lg:aspect-auto lg:h-80" />
                    <div className="h-4 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                </div>
            ))}
        </div>
    );
}
