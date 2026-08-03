import { wixClientServer } from "@/lib/wixClientServer";
import Image from "next/image";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import Pagination from "./Pagination";
import {products} from "@wix/stores";
import Add from "@/components/Add";


const PRODUCT_PER_PAGE = 20;

// Normalize category names so "Editors Choice" matches "Editor's Choice" etc.
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const ProductList= async ({
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
        } catch (e) {}
    }

    let productQuery = wixClient.products
        .queryProducts()
        .startsWith("name", searchParams?.name || "");

    if (resolvedCategoryId) {
        productQuery = productQuery.eq("collectionIds", resolvedCategoryId);
    }

    productQuery = productQuery
        .hasSome(
            "productType",
            searchParams?.type ? [searchParams.type] : ["physical", "digital"]
        )
        .gt("priceData.price", searchParams?.min || 0)
        .lt("priceData.price", searchParams?.max || 999999)
        .limit(limit || PRODUCT_PER_PAGE)
        .skip(
            searchParams?.page
                ? parseInt(searchParams.page) * (limit || PRODUCT_PER_PAGE)
                : 0
        );
        //.find();
    if (searchParams?.sort) {
        const [sortType, sortBy] = searchParams.sort.split(" ");

        if (sortType === "asc") {
            productQuery.ascending(sortBy);
        }
        if (sortType === "desc") {
            productQuery.descending(sortBy);
        }
    }

    const res = await productQuery.find();


    return (
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-16">
            {res.items.map((product: products.Product) => (
                <Link
                    href={"/" + product.slug}
                    className="flex flex-col gap-4"
                    key={product._id}
                >
                    <div className="relative w-full aspect-square lg:aspect-auto lg:h-80">
                        <Image
                            src={product.media?.mainMedia?.image?.url || "/product.png"}
                            alt=""
                            fill
                            sizes="25vw"
                            className="absolute object-cover rounded-md z-10 hover:opacity-0 transition-opacity easy duration-500"
                        />
                        {product.media?.items && (
                            <Image
                                src={product.media?.items[1]?.image?.url || "/product.png"}
                                alt=""
                                fill
                                sizes="25vw"
                                className="absolute object-cover rounded-md"
                            />
                        )}
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">{product.name}</span>
                        <span className="font-semibold">KES {product.price?.price}</span>
                    </div>
                    {product.additionalInfoSections && (
                        <div
                            className="text-sm text-gray-500"
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(
                                    product.additionalInfoSections.find(
                                        (section: any) => section.title === "shortDesc"
                                    )?.description || ""
                                ),
                            }}
                        ></div>
                    )}
                    <button className="relative rounded-2xl ring-2 ring-pink-500 text-pink-600 w-full py-3 px-4 text-sm font-semibold overflow-hidden group">
                        <span className="absolute inset-0 bg-pink-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
                        <span className="relative z-10 group-hover:text-white transition-colors duration-300">Add to Cart</span>

                    </button>
                </Link>
            ))}
            <Pagination
                currentPage={res.currentPage || 0}
                hasPrev={res.hasPrev()}
                hasNext={res.hasNext()}
            />
        </div>
    );
};

export default ProductList;