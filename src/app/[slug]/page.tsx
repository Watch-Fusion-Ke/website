import Add from "@/components/Add";
import CustomizeProducts from "@/components/CustomizeProducts";
import ProductImages from "@/components/ProductImages";
import { wixClientServer } from "@/lib/wixClientServer";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import DOMPurify from "isomorphic-dompurify";
import { Metadata } from "next";

type Props = {
    params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = params;
    const wixClient = await wixClientServer();
    const products = await wixClient.products
        .queryProducts()
        .eq("slug", slug)
        .find();

    const product = products.items[0];
    if (!product) return { title: "Product Not Found" };

    const plainDescription = product.description
        ? product.description.replace(/<[^>]*>/g, "").slice(0, 160)
        : `Buy ${product.name} at WatchFusion Kenya. Premium watches with fast delivery across Nairobi and Kenya.`;

    return {
        title: product.name,
        description: plainDescription,
        openGraph: {
            title: `${product.name} | WatchFusion Kenya`,
            description: plainDescription,
            url: `https://watchfusionkenya.com/${slug}`,
            images: product.media?.mainMedia?.image?.url
                ? [{ url: product.media.mainMedia.image.url, alt: product.name || "Watch" }]
                : [],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: `${product.name} | WatchFusion Kenya`,
            description: plainDescription,
            images: product.media?.mainMedia?.image?.url
                ? [product.media.mainMedia.image.url]
                : [],
        },
        alternates: {
            canonical: `https://watchfusionkenya.com/${slug}`,
        },
    };
}

const SinglePage = async ({ params }: Props) => {
    const { slug } = params;

    const wixClient = await wixClientServer();

    const products = await wixClient.products
        .queryProducts()
        .eq("slug", slug)
        .find();

    if (!products.items[0]) {
        return notFound();
    }

    const product = products.items[0];

    return (
        <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 relative flex flex-col lg:flex-row gap-16 py-8">
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Product",
                        name: product.name,
                        image: product.media?.mainMedia?.image?.url,
                        description: product.description
                            ? product.description.replace(/<[^>]*>/g, "").slice(0, 300)
                            : "",
                        offers: {
                            "@type": "Offer",
                            price: product.price?.discountedPrice || product.price?.price,
                            priceCurrency: "KES",
                            availability: product.stock?.inStock
                                ? "https://schema.org/InStock"
                                : "https://schema.org/OutOfStock",
                            url: `https://watchfusionkenya.com/${slug}`,
                        },
                    }),
                }}
            />
            {/* IMG */}
            <div className="w-full lg:w-1/2 lg:sticky top-20 h-max">
                <ProductImages items={product.media?.items} />
            </div>

            {/* TEXTS */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
                <h1 className="font-display text-4xl font-bold leading-tight">{product.name}</h1>

                {product.description && (
                    <div
                        className="text-gray-600 leading-relaxed"
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(product.description),
                        }}
                    />
                )}

                <div className="h-[2px] bg-gray-100" />

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

                {/* Add to Cart / Customize */}
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

                <div className="h-[2px] bg-gray-100" />

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