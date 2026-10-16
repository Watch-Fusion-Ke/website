import { wixClientServer } from "@/lib/wixClientServer";
import { listProducts } from "@/lib/storeProducts";
import Image from "next/image";
import Link from "next/link";
import Pagination from "./Pagination";

// Normalize category names so "Editors Choice" matches "Editor's Choice" etc.
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const ProductList = async ({
    categoryId,
    categoryName,
    limit,
    searchParams,
}: {
    categoryId: string;
    categoryName?: string;
    limit?: number;
    searchParams?: any;
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
        });
    } catch (e) {
        console.error("ProductList: product search failed", e);
        return (
            <p className="mt-12 text-gray-500">
                We could not load the products right now. Please refresh in a moment.
            </p>
        );
    }

    return (
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-16">
            {page.items.map((product) => (
                <Link
                    href={"/" + product.slug}
                    className="flex flex-col gap-4"
                    key={product.id}
                >
                    <div className="relative w-full aspect-square lg:aspect-auto lg:h-80">
                        <Image
                            src={product.imageUrl || "/product.png"}
                            alt=""
                            fill
                            sizes="25vw"
                            className={`absolute object-cover rounded-md z-10 transition-opacity duration-500 ${product.hoverImageUrl ? "hover:opacity-0" : ""}`}
                        />
                        {product.hoverImageUrl && (
                            <Image
                                src={product.hoverImageUrl}
                                alt=""
                                fill
                                sizes="25vw"
                                className="absolute object-cover rounded-md"
                            />
                        )}
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">{product.name}</span>
                        <span className="font-semibold">{product.priceLabel}</span>
                    </div>
                    <button className="relative rounded-2xl ring-2 ring-pink-500 text-pink-600 w-full py-3 px-4 text-sm font-semibold overflow-hidden group">
                        <span className="absolute inset-0 bg-pink-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
                        <span className="relative z-10 group-hover:text-white transition-colors duration-300">Add to Cart</span>
                    </button>
                </Link>
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
