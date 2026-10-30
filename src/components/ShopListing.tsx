import { Suspense } from "react";
import ProductList from "@/components/ProductList";
import Filter from "@/components/Filter";
import CategoryChips from "@/components/CategoryChips";
import { wixClientServer } from "@/lib/wixClientServer";
import { getPriceBounds } from "@/lib/storeProducts";
import { ALL_PRODUCTS_SLUG, categoryHref, type CategoryPage } from "@/lib/categoryPages";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

type Params = { [key: string]: string | string[] | undefined };

// What the shop page and every category page show: the heading, the category pills, the filters and the products.
// With no category it is the whole shop.
const ShopListing = async ({ category, categories, searchParams }: { category: CategoryPage | null; categories: CategoryPage[]; searchParams: Params }) => {
  const searched = typeof searchParams.name === "string" ? searchParams.name.trim() : "";
  const wixClient = await wixClientServer();
  const bounds = await getPriceBounds((url, init) => wixClient.fetchWithAuth(url, init));

  // The pills come from the store's real categories, so none of them is a dead link.
  const chips = categories.filter((c) => c.slug !== ALL_PRODUCTS_SLUG).map((c) => ({ name: c.name, slug: c.slug }));

  return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Shop", path: "/shop" },
              ...(category ? [{ name: category.name, path: categoryHref(category.slug) }] : []),
            ])
          ),
        }}
      />
      <div className="pt-8 pb-6">
        <h1 className="font-display text-4xl font-bold md:text-5xl mb-2">
          {searched ? `Results for “${searched}”` : category?.name || "Shop all products"}
        </h1>
        <p className="text-gray-600">
          {searched
            ? "Matching products from the whole shop"
            : category
              ? category.description || `Browse our ${category.name} collection`
              : "Browse our complete collection"}
        </p>
      </div>

      <CategoryChips chips={chips} activeSlug={searched ? null : category ? category.slug : ""} />

      <div className="mt-6 border-y border-gray-200 py-5">
        <Suspense fallback={<div className="h-16" />}>
          <Filter bounds={bounds} />
        </Suspense>
      </div>

      <div className="pb-8">
        <Suspense fallback={<ProductListSkeleton />}>
          <ProductList categoryId={category?.id ?? ""} searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
};

const ProductListSkeleton = () => (
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

export default ShopListing;
