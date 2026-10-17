import ProductList from "@/components/ProductList";
import { wixClientServer } from "@/lib/wixClientServer";
import Link from "next/link";
import { Suspense } from "react";

const SUBCATEGORIES = [
    { label: "All Deals", slug: "" },
    { label: "Accessories", slug: "accessories" },
    { label: "Couple Sets", slug: "couple-sets" },
    { label: "Gents Watches", slug: "gents-watches" },
    { label: "Ladies Watches", slug: "ladies-watches" },
];

export default async function DealsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const catSlug = typeof resolvedParams.cat === "string" ? resolvedParams.cat : "";

    let categoryId = "";
    let categoryName = "All Deals";

    if (catSlug) {
        try {
            const wixClient = await wixClientServer();
            const cat = await wixClient.collections.getCollectionBySlug(catSlug);
            categoryId = cat.collection?._id || "";
            categoryName = cat.collection?.name || catSlug;
        } catch {
            // If slug not found, fall back to all products
        }
    }

    return (
        <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64">
            {/* Header Banner */}
            <div className="py-8 md:py-12">
                <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-8 md:p-12 text-white">
          <span className="inline-block bg-white text-red-500 px-4 py-1 rounded-full text-sm font-semibold mb-4">
            LIMITED TIME OFFERS
          </span>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                        Hot Deals & Discounts
                    </h1>
                    <p className="text-lg md:text-xl mb-6 opacity-90">
                        Save big on our best-selling products. Don&apos;t miss out!
                    </p>
                </div>
            </div>

            {/* Subcategory Navigation */}
            <div className="flex gap-3 flex-wrap mb-8">
                {SUBCATEGORIES.map((sub) => (
                    <Link
                        key={sub.slug}
                        href={sub.slug ? `/deals?cat=${sub.slug}` : "/deals"}
                        className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                            catSlug === sub.slug
                                ? "bg-red-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        {sub.label}
                    </Link>
                ))}
            </div>

            {/* Deal Categories */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                <div className="bg-gray-100 rounded-lg p-4 text-center hover:bg-gray-200 transition-colors cursor-pointer">
                    <div className="font-semibold">Flash Sales</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 text-center hover:bg-gray-200 transition-colors cursor-pointer">
                    <div className="font-semibold">Bundle Offers</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 text-center hover:bg-gray-200 transition-colors cursor-pointer">
                    <div className="font-semibold">Up to 50% Off</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 text-center hover:bg-gray-200 transition-colors cursor-pointer">
                    <div className="font-semibold">New Deals</div>
                </div>
            </div>

            {/* Deal Products */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl md:text-3xl font-semibold">
                        {categoryName === "All Deals"
                            ? "Today's Best Deals"
                            : `${categoryName} Deals`}
                    </h2>
                    <div className="text-sm text-gray-600">
                        <span className="font-semibold text-red-500">Ends in: </span>
                        <span>23h 45m 12s</span>
                    </div>
                </div>
                <Suspense fallback={<ProductListSkeleton />}>
                    <ProductList
                        categoryId={categoryId}
                        searchParams={resolvedParams}
                        limit={12}
                    />
                </Suspense>
            </section>
        </div>
    );
}

function ProductListSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col gap-4">
                    <div className="w-full h-80 bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                </div>
            ))}
        </div>
    );
}