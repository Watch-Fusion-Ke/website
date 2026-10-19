import ProductList from "@/components/ProductList";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
    title: "Deals",
    description: "Watches and gifts on offer at Watch Fusion Kenya right now, with the sale price shown beside the usual one.",
    alternates: { canonical: "/deals" },
};

// Lists the products that are really on sale: those with an old price set above the current price in Wix.
// Nothing here needs updating by hand. Changing a price in Wix changes this page.
export default async function DealsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;

    return (
        <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64">
            <div className="py-8 md:py-12">
                <div className="rounded-2xl bg-brand-panel p-8 text-white md:p-12">
                    <h1 className="font-display text-4xl font-bold md:text-5xl">Deals</h1>
                    <p className="mt-3 max-w-xl text-base text-white/80 md:text-lg">
                        Watches and gifts on offer right now. The offers change often, so check back.
                    </p>
                    <Link
                        href="/shop"
                        className="mt-6 inline-block rounded-lg bg-brand-gold px-6 py-2.5 text-sm font-bold text-brand-navy transition-colors hover:bg-brand-gold-dark"
                    >
                        Shop everything
                    </Link>
                </div>
            </div>

            <section className="pb-8">
                <h2 className="font-display text-3xl font-bold">On offer now</h2>
                <Suspense fallback={<ProductListSkeleton />}>
                    <ProductList
                        categoryId=""
                        searchParams={resolvedParams}
                        limit={12}
                        onSale
                        emptyMessage="There are no offers right now. New offers appear here as soon as they are set, so check back soon."
                    />
                </Suspense>
            </section>
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
