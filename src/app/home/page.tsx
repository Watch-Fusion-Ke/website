import ProductList from "@/components/ProductList";
import { Suspense } from "react";

export default async function HomePage({
                                     searchParams,
                                 }: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    return (
        <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64">
            {/* Hero Section */}
            <section className="py-8 md:py-12">
                <div className="bg-brand-cream rounded-2xl p-8 md:p-12 lg:p-16">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                        Welcome to Our Store
                    </h1>
                    <p className="text-gray-600 text-lg md:text-xl mb-6 max-w-2xl">
                        Discover amazing products at great prices. Shop the latest trends and exclusive deals.
                    </p>
                    <button className="bg-brand-navy text-white px-6 py-3 rounded-full hover:bg-brand-gold hover:text-brand-navy transition-colors">
                        Shop Now
                    </button>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl md:text-3xl font-semibold">Featured Products</h2>
                </div>
                <Suspense fallback={<ProductListSkeleton />}>
                    <ProductList categoryId="" searchParams={resolvedParams} />
                </Suspense>
            </section>
        </div>
    );
}

// Loading skeleton component
function ProductListSkeleton() {
    return (
        <div className="mt-12 flex gap-x-8 gap-y-16 justify-between flex-wrap">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="w-full flex flex-col gap-4 sm:w-[45%] lg:w-[22%]">
                    <div className="relative w-full h-80 bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                </div>
            ))}
        </div>
    );
}