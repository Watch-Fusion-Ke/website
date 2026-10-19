import Image from "next/image";
import Link from "next/link";
import type { ProductCard } from "@/lib/storeProducts";

const SIZES = "(max-width: 1023px) 50vw, 25vw";

// One product in a grid: photo, name over two lines, the price on its own line, one button.
// A sale shows the old price struck through, the new price in navy and a gold tag with the percent off.
const ProductCardView = ({ product }: { product: ProductCard }) => {
    const onSale = product.compareAtLabel !== null && product.discountPercent !== null;

    return (
        <Link href={"/" + product.slug} className="group flex flex-col gap-3">
            <div className="relative w-full aspect-square lg:aspect-auto lg:h-80">
                <Image
                    src={product.imageUrl || "/product.png"}
                    alt=""
                    fill
                    sizes={SIZES}
                    className={`absolute object-cover rounded-md z-10 transition-opacity duration-500 ${product.hoverImageUrl ? "md:group-hover:opacity-0" : ""}`}
                />
                {product.hoverImageUrl && (
                    <Image
                        src={product.hoverImageUrl}
                        alt=""
                        fill
                        sizes={SIZES}
                        className="absolute object-cover rounded-md"
                    />
                )}
                {onSale && (
                    <span className="absolute top-2 left-2 z-20 rounded bg-brand-gold px-2 py-0.5 text-xs font-bold text-brand-navy">
                        Sale {product.discountPercent}% off
                    </span>
                )}
            </div>
            <h3 className="font-medium leading-snug line-clamp-2 min-h-[2.75rem]">{product.name}</h3>
            <p data-price className="flex flex-wrap items-baseline gap-x-2">
                {onSale ? (
                    <>
                        <span className="sr-only">Was {product.compareAtLabel}. Now {product.priceLabel}</span>
                        <s aria-hidden="true" className="text-sm text-gray-500">{product.compareAtLabel}</s>
                        <span aria-hidden="true" className="font-semibold text-brand-navy">{product.priceLabel}</span>
                    </>
                ) : (
                    <span className="font-semibold text-brand-navy">{product.priceLabel}</span>
                )}
            </p>
            <span aria-hidden="true" className="block w-full rounded-lg bg-brand-navy py-3 px-4 text-center text-sm font-semibold text-white transition-colors duration-300 md:group-hover:bg-brand-gold md:group-hover:text-brand-navy">
                Add to cart
            </span>
        </Link>
    );
};

export default ProductCardView;
