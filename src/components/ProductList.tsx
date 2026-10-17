import { wixClientServer } from "@/lib/wixClientServer";
import { listProducts } from "@/lib/storeProducts";
import Pagination from "./Pagination";
import ProductCardView from "./ProductCard";

// Normalize category names so "Editors Choice" matches "Editor's Choice" etc.
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const ProductList = async ({
    categoryId,
    categoryName,
    limit,
    searchParams,
    onSale,
    emptyMessage,
}: {
    categoryId: string;
    categoryName?: string;
    limit?: number;
    searchParams?: any;
    onSale?: boolean;
    emptyMessage?: string;
}) => {
    const wixClient = await wixClientServer();

    // If a category name is given, resolve it to a collection id (categoryId is the fallback)
    let resolvedCategoryId = categoryId;
    if (categoryName) {
        try {
            const cats = await wixClient.collections.queryCollections().find();
            const match = cats.items.find(
                (c) => c.name && normalize(c.name) === normalize(categoryName)
            );
            if (match?._id) resolvedCategoryId = match._id;
        } catch (e) {
            console.error("ProductList: category lookup failed, using the given id", e);
        }
    }

    let page;
    try {
        page = await listProducts((url, init) => wixClient.fetchWithAuth(url, init), {
            categoryId: resolvedCategoryId,
            name: searchParams?.name,
            type: searchParams?.type,
            min: searchParams?.min,
            max: searchParams?.max,
            sort: searchParams?.sort,
            page: searchParams?.page,
            limit,
            onSale,
        });
    } catch (e) {
        console.error("ProductList: product search failed", e);
        return (
            <p className="mt-12 text-gray-500">
                We could not load the products right now. Please refresh in a moment.
            </p>
        );
    }

    if (page.items.length === 0) {
        return <p className="mt-6 text-gray-600">{emptyMessage ?? "No products found."}</p>;
    }

    return (
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12">
            {page.items.map((product) => (
                <ProductCardView product={product} key={product.id} />
            ))}
            <Pagination
                currentPage={page.page}
                hasPrev={page.hasPrev}
                hasNext={page.hasNext}
            />
        </div>
    );
};

export default ProductList;
