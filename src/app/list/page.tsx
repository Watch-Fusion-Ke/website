import Filter from "@/components/Filter";
import ProductList from "@/components/ProductList";
import Skeleton from "@/components/Skeleton";
import { wixClientServer } from "@/lib/wixClientServer";
import Image from "next/image";
import { Suspense } from "react";

const ListPage = async ({ searchParams }: { searchParams: any }) => {
    const wixClient = await wixClientServer();

    const cat = await wixClient.collections.getCollectionBySlug(
        searchParams.cat || "all-products"
    );


    return (
        <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 relative">
            
            {/* FILTER */}
            <div className="mt-8">
                <Filter />
            </div>
            {/* PRODUCTS */}
            <h1 className="font-display mt-12 text-3xl font-bold">{cat?.collection?.name} For You!</h1>
            <Suspense fallback={<Skeleton/>}>
                <ProductList
                    categoryId={cat.collection?._id || ""}  // Will be undefined for "all-products"
                    searchParams={searchParams}
                />
            </Suspense>
        </div>
    );
};

export default ListPage;