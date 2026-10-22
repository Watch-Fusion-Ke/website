
import CategoryList from "@/components/CategoryList";
import ProductList from "@/components/ProductList";
import Skeleton from "@/components/Skeleton";
import Slider from "@/components/Slider";
import { Suspense } from "react";

export const metadata = { alternates: { canonical: "/" } };

const HomePage = async () => {




  return (
    <div className="">
      <div className="mt-0 md:mt-6">
        <Suspense fallback={<Skeleton />}>
          <CategoryList />
        </Suspense>
      </div>
      <Slider />
      <div className="mt-10 md:mt-12 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64">
        <h2 className="font-display text-3xl font-bold">Customer Favourites</h2>
        <Suspense fallback={<Skeleton />}>
          <ProductList
            categoryId={process.env.FEATURED_PRODUCTS_CATEGORY_ID!}
            categoryName="Editor's Picks"
            limit={9}
          />
        </Suspense>
      </div>
      <div className="mt-10 md:mt-12 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64">
        <h2 className="font-display text-3xl font-bold">New Products</h2>
        <Suspense fallback={<Skeleton />}>
            <ProductList
                categoryId={process.env.NEW_PRODUCTS_CATEGORY_ID!}
                limit={9}
            />
        </Suspense>
      </div>
    </div>
  );
};

export default HomePage;