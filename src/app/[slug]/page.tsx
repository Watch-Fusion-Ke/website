import Add from "@/components/Add";
import CustomizeProducts from "@/components/CustomizeProducts";
import ProductImages from "@/components/ProductImages";
import OrderOnWhatsApp from "@/components/OrderOnWhatsApp";
import ProductDescription from "@/components/ProductDescription";
import { wixClientServer } from "@/lib/wixClientServer";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import DOMPurify from "isomorphic-dompurify";
import { Metadata } from "next";
import { breadcrumbJsonLd, jsonLdScript, productJsonLd, productMetadata } from "@/lib/seo";
import type { SeoTag } from "@/lib/categoryPages";
import { SITE_URL } from "@/lib/site";

type Props = {
    params: { slug: string };
};

// Everything a search engine or a link preview is told about a product comes from one place, src/lib/seo.ts: the title and description
// the shop wrote for the product in the store when there are some, a clean one made from its own text when there are not.
const seoOf = (product: Awaited<ReturnType<typeof findProduct>>, slug: string) => {
    const photos = (product?.media?.items ?? []).flatMap((item) => (item?.image?.url ? [item.image.url] : []));
    return {
        name: product?.name ?? "",
        slug,
        description: product?.description,
        seoTags: product?.seoData?.tags as SeoTag[] | undefined,
        imageUrl: product?.media?.mainMedia?.image?.url ?? null,
        imageUrls: photos,
        sku: product?.sku,
        brand: product?.brand,
        price: product?.price?.discountedPrice || product?.price?.price || null,
        inStock: Boolean(product?.stock?.inStock),
    };
};

const findProduct = async (slug: string) => {
    const wixClient = await wixClientServer();
    const products = await wixClient.products.queryProducts().eq("slug", slug).find();
    return products.items[0];
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = params;
    const product = await findProduct(slug);
    if (!product) return { title: "Product Not Found" };
    return productMetadata(seoOf(product, slug));
}

const SinglePage = async ({ params }: Props) => {
    const { slug } = params;

    const product = await findProduct(slug);

    if (!product) {
        return notFound();
    }

    return (
        <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 relative flex flex-col lg:flex-row gap-6 lg:gap-16 py-4 lg:py-8">
            {/* What search engines are told about the product, and where it sits in the shop */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(productJsonLd(seoOf(product, slug))) }} />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLdScript(
                        breadcrumbJsonLd([
                            { name: "Home", path: "/" },
                            { name: "Shop", path: "/shop" },
                            { name: product.name ?? "Product", path: `/${slug}` },
                        ])
                    ),
                }}
            />
            {/* IMG */}
            <div className="w-full lg:w-1/2 lg:sticky lg:top-24 h-max min-w-0">
                <ProductImages key={product._id} items={product.media?.items} name={product.name ?? undefined} />
            </div>

            {/* TEXTS */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
                <h1 className="font-display text-2xl font-bold leading-tight sm:text-4xl">{product.name}</h1>

                {/* Price */}
                {product.price?.price === product.price?.discountedPrice ? (
                    <h2 className="font-semibold text-3xl">KES {product.price?.price}</h2>
                ) : (
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl text-gray-500 line-through">
                            KES {product.price?.price}
                        </h3>
                        <h2 className="font-semibold text-3xl text-brand-navy">
                            KES {product.price?.discountedPrice}
                        </h2>
                    </div>
                )}

                <div className="h-[2px] bg-gray-100" />

                {/* Add to Cart / Customize, with Order on WhatsApp right under it */}
                <div className="flex flex-col gap-3">
                    {product.variants && product.productOptions && product.productOptions.length > 0 ? (
                        <CustomizeProducts
                            productId={product._id!}
                            variants={product.variants}
                            productOptions={product.productOptions}
                        />
                    ) : (
                        <Add
                            productId={product._id!}
                            variantId="00000000-0000-0000-0000-000000000000"
                            stockNumber={
                              product.stock?.quantity ?? (product.stock?.inStock ? 9999 : 0)
                            }
                        />
                    )}

                    <OrderOnWhatsApp
                        name={product.name ?? "this product"}
                        price={product.price?.discountedPrice ?? product.price?.price ?? undefined}
                        hasOptions={Boolean(product.productOptions && product.productOptions.length > 0)}
                        url={`${SITE_URL}/${slug}`}
                    />
                </div>

                <div className="h-[2px] bg-gray-100" />

                {product.description && <ProductDescription html={product.description} />}

                {/* Additional Info */}
                {product.additionalInfoSections?.map((section: any) => (
                    <div className="text-sm" key={section.title}>
                        <h4 className="font-semibold text-lg mb-2">{section.title}</h4>
                        <div
                            className="text-gray-600"
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(section.description || ""),
                            }}
                        />
                    </div>
                ))}

                <div className="h-[2px] bg-gray-100" />

                
            </div>
        </div>
    );
};

export default SinglePage;