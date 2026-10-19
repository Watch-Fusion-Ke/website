"use client";

import { useCartStore } from "@/hooks/useCartStore";
import { useWixClient } from "@/hooks/useWixClient";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Add = ({
  productId,
  variantId,
  stockNumber,
}: {
  productId: string;
  variantId: string;
  stockNumber: number;
}) => {
  const [quantity, setQuantity] = useState(1);

  const router = useRouter();

  const handleQuantity = (type: "i" | "d") => {
    if (type === "d" && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
    if (type === "i" && quantity < stockNumber) {
      setQuantity((prev) => prev + 1);
    }
  };

  const wixClient = useWixClient();

  const { addItem, isLoading } = useCartStore();

  const handleAddToCart = async () => {
    await addItem(wixClient, productId, variantId, quantity);
    router.push("/cart");
  };

  // A quantity of 9999 only means "in stock, quantity not tracked", so it is never shown as a count.
  const stockNote =
    stockNumber < 1 ? (
      <p className="whitespace-nowrap text-sm text-red-500">Out of stock</p>
    ) : stockNumber < 100 ? (
      <p className="whitespace-nowrap text-sm text-gray-600">
        Only <span className="font-semibold text-orange-500">{stockNumber}</span> left
      </p>
    ) : (
      <p className="whitespace-nowrap text-sm text-gray-600">In stock</p>
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="font-medium">Choose a Quantity</h4>
        {stockNote}
      </div>
      <div className="flex items-center gap-4">
        <div className="bg-gray-100 rounded-3xl flex items-center justify-between w-32 h-11 px-1 flex-shrink-0">
          <button
            aria-label="Decrease quantity"
            className="w-10 h-10 cursor-pointer text-xl disabled:cursor-not-allowed disabled:opacity-20"
            onClick={() => handleQuantity("d")}
            disabled={quantity === 1}
          >
            -
          </button>
          <span className="font-medium" aria-live="polite">{quantity}</span>
          <button
            aria-label="Increase quantity"
            className="w-10 h-10 cursor-pointer text-xl disabled:cursor-not-allowed disabled:opacity-20"
            onClick={() => handleQuantity("i")}
            disabled={quantity === stockNumber}
          >
            +
          </button>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={isLoading || stockNumber < 1}
          className="flex-1 h-11 text-sm rounded-3xl bg-brand-navy text-white px-4 hover:bg-brand-gold hover:text-brand-navy transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default Add;
