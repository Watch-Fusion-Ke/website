"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "@/hooks/useCartStore";
import { useWixClient } from "@/hooks/useWixClient";
import { media as wixMedia } from "@wix/sdk";
import { currentCart } from "@wix/ecom";
import DeliveryPicker from "@/components/DeliveryPicker";
import useDelivery from "@/hooks/useDelivery";
import { DELIVERY_PREFIX, formatKes, isDeliveryLine, needsDeliveryArea } from "@/lib/delivery";

const CartPage = () => {
  const wixClient = useWixClient();
  const { cart, isLoading, removeItem, getCart } = useCartStore();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const delivery = useDelivery();

  useEffect(() => {
    getCart(wixClient);
  }, [wixClient, getCart]);

  // The delivery fee is a line in the cart. It is shown as its own row, never as a product.
  const allLines = cart.lineItems ?? [];
  const products = allLines.filter((item) => !isDeliveryLine(item));
  const deliveryLine = allLines.find(isDeliveryLine);
  const deliveryFee = deliveryLine ? Number(deliveryLine.price?.amount) : null;
  const total = Number(cart.subtotal?.amount);
  const productsSubtotal =
    deliveryFee !== null && Number.isFinite(deliveryFee) && Number.isFinite(total) ? formatKes(total - deliveryFee) : null;

  // A delivery fee left behind after the last product is removed would charge for nothing, so it goes too.
  const { clear } = delivery;
  const strandedFee = Boolean(deliveryLine) && products.length === 0;
  useEffect(() => {
    if (strandedFee) clear().then(() => getCart(wixClient));
  }, [strandedFee, clear, getCart, wixClient]);

  const handleRemove = async (itemId: string | undefined) => {
    if (!itemId || isLoading) return;
    setRemovingId(itemId);
    await removeItem(wixClient, itemId);
    setRemovingId(null);
  };

  const handleCheckout = async () => {
  setCheckoutError(null);
  try {
    const checkout =
      await wixClient.currentCart.createCheckoutFromCurrentCart({
        channelType: currentCart.ChannelType.WEB,
      });

    const { redirectSession } =
      await wixClient.redirects.createRedirectSession({
        ecomCheckout: { checkoutId: checkout.checkoutId },
        callbacks: {
          postFlowUrl: "https://www.watchfusionkenya.com",
          thankYouPageUrl: "https://www.watchfusionkenya.com/success",
        },
      });

    if (redirectSession?.fullUrl) {
      window.location.href = redirectSession.fullUrl;
    }
  } catch (err) {
    console.error(err);
    setCheckoutError("Checkout failed. Please try again.");
  }
};

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-10 min-h-[calc(100vh-180px)]">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 flex flex-col gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 border border-gray-100 rounded-xl">
                <div className="w-24 h-32 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-3 py-1">
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-2/3" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3 mt-auto" />
                </div>
              </div>
            ))}
          </div>
          <div className="lg:w-80">
            <div className="bg-gray-50 rounded-2xl p-6 flex flex-col gap-4">
              <div className="h-6 w-36 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse mt-2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-10 min-h-[calc(100vh-180px)] flex flex-col items-center justify-center gap-5">
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <p className="text-xl font-semibold text-gray-600">Your cart is empty</p>
        <p className="text-sm text-gray-400">Add some products and come back!</p>
        <Link href="/shop" className="bg-brand-navy text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-brand-gold hover:text-brand-navy transition-colors">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-10 min-h-[calc(100vh-180px)]">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8 border-b pb-4">
        <h1 className="font-display text-4xl font-bold">Shopping Cart</h1>
        <Link href="/shop" className="text-sm text-gray-500 hover:text-black transition-colors">
          ← Continue Shopping
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Cart Items */}
        <div className="flex-1 flex flex-col gap-5">
          {products.map((item) => (
            <div key={item._id} className="flex gap-5 p-4 rounded-xl border border-gray-100 shadow-sm bg-white">
              {/* Product Image */}
              {item.image && (
                <Image
                  src={wixMedia.getScaledToFillImageUrl(item.image, 100, 130, {})}
                  alt={item.productName?.original || "Product"}
                  width={100}
                  height={130}
                  className="object-cover rounded-lg flex-shrink-0"
                />
              )}

              {/* Product Info */}
              <div className="flex flex-col justify-between flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.productName?.original}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{item.availability?.status}</p>
                  </div>
                  <span className="font-bold text-gray-900 whitespace-nowrap">
                    {item.price?.formattedAmount ?? `KES ${item.price?.amount}`}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                    Qty: <span className="font-medium text-gray-900">{item.quantity}</span>
                  </span>
                  <button
                    onClick={() => handleRemove(item._id || undefined)}
                    disabled={isLoading || removingId === item._id}
                    className="text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {removingId === item._id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0">
          <div className="bg-gray-50 rounded-2xl p-6 sticky top-8">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Order Summary</h2>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({products.length} {products.length === 1 ? "item" : "items"})</span>
                <span className="font-semibold text-gray-900">{productsSubtotal ?? cart.subtotal?.formattedAmount ?? "KES 0.00"}</span>
              </div>
              {delivery.enabled ? (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="font-semibold text-gray-900">
                    {deliveryLine ? (deliveryLine.price?.formattedAmount ?? formatKes(deliveryFee ?? 0)) : "Choose an area"}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
              )}
              <div className="flex justify-between text-gray-400 text-xs">
                <span>Taxes</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between font-bold">
              <span>Total</span>
              <span>{cart.subtotal?.formattedAmount ?? "KES 0.00"}</span>
            </div>

            {delivery.enabled && (
              <div className="mt-5">
                <DeliveryPicker
                  areas={delivery.areas}
                  selectedLabel={deliveryLine ? (deliveryLine.productName?.original ?? "").slice(DELIVERY_PREFIX.length) : null}
                  selectedPrice={deliveryFee !== null && Number.isFinite(deliveryFee) ? deliveryFee : null}
                  onChosen={async (area) => {
                    await delivery.choose(area);
                    await getCart(wixClient);
                  }}
                />
              </div>
            )}

            {needsDeliveryArea(delivery.enabled, allLines) && (
              <p className="mt-3 text-xs text-gray-600">Choose a delivery area to continue.</p>
            )}

            {checkoutError && (
              <p className="mt-3 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{checkoutError}</p>
            )}

            <button
              onClick={handleCheckout}
              disabled={isLoading || needsDeliveryArea(delivery.enabled, allLines)}
              className="w-full mt-5 bg-brand-navy text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-brand-gold hover:text-brand-navy transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Proceed to Checkout
            </button>

            <Link href="/shop" className="block text-center mt-3 text-sm text-gray-500 hover:text-black transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;