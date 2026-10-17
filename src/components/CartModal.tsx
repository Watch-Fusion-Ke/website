"use client";

import Image from "next/image";
import { useCartStore } from "@/hooks/useCartStore";
import { media as wixMedia } from "@wix/sdk";
import { useWixClient } from "@/hooks/useWixClient";
import { currentCart } from "@wix/ecom";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useDelivery from "@/hooks/useDelivery";
import { formatKes, isDeliveryLine, needsDeliveryArea } from "@/lib/delivery";

interface CartModalProps {
  onClose: () => void;
}

const CartModal = ({ onClose }: CartModalProps) => {
  const wixClient = useWixClient();
  const { cart, isLoading, removeItem } = useCartStore();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const router = useRouter();
  const delivery = useDelivery();

  // The delivery fee is a line in the cart, shown on the cart page and not here as a product.
  const allLines = cart.lineItems ?? [];
  const products = allLines.filter((item) => !isDeliveryLine(item));
  const fee = allLines.find(isDeliveryLine);
  const feeAmount = fee ? Number(fee.price?.amount) : NaN;
  const total = Number(cart.subtotal?.amount);
  const subtotalLabel = Number.isFinite(feeAmount) && Number.isFinite(total) ? formatKes(total - feeAmount) : cart.subtotal?.formattedAmount;

  const handleCheckout = async () => {
  setCheckoutError(null);
  // With delivery fees on, the shopper picks a delivery area on the cart page first.
  if (needsDeliveryArea(delivery.enabled, allLines, delivery.unavailable)) {
    onClose();
    router.push("/cart");
    return;
  }
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
    setCheckoutError("Something went wrong during checkout. Please try again.");
  }
};

  const handleViewCart = () => {
    router.push("/cart");
    onClose();
  };

  const handleRemoveItem = (itemId: string | undefined) => {
    if (!itemId || isLoading) return;
    removeItem(wixClient, itemId);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="w-80 sm:w-96 absolute p-5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-white top-14 right-0 flex flex-col gap-5 z-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
            aria-label="Close cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Empty state */}
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <p className="text-sm font-medium">Your cart is empty</p>
            <button
              onClick={onClose}
              className="text-sm text-blue-500 hover:underline mt-1"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className="flex flex-col gap-5 max-h-72 overflow-y-auto pr-1">
              {products.map((item) => (
                <div className="flex gap-4" key={item._id}>
                  {item.image && (
                    <Image
                      src={wixMedia.getScaledToFillImageUrl(
                        item.image,
                        72,
                        96,
                        {}
                      )}
                      alt={item.productName?.original || "Product image"}
                      width={72}
                      height={96}
                      className="object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex flex-col justify-between w-full min-w-0">
                    {/* Top */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-gray-900 text-sm leading-snug truncate">
                          {item.productName?.original}
                        </h3>
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {item.price?.formattedAmount ?? `KES ${item.price?.amount}`}
                        </span>
                      </div>
                      {item.quantity && item.quantity > 1 && (
                        <p className="text-xs text-green-600 mt-0.5">
                          {item.quantity} × {item.price?.formattedAmount ?? `KES ${item.price?.amount}`}
                        </p>
                      )}
                      <div className="text-xs text-gray-400 mt-0.5">
                        {item.availability?.status}
                      </div>
                    </div>

                    {/* Bottom */}
                    <div className="flex justify-between items-center text-xs mt-2">
                      <span className="text-gray-400">Qty: {item.quantity}</span>
                      <button
                        className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={isLoading || !item._id}
                        onClick={() => handleRemoveItem(item._id || undefined)}
                        aria-label={`Remove ${item.productName?.original}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between font-semibold text-gray-900">
                <span>Subtotal</span>
                <span>{subtotalLabel ?? "KES 0.00"}</span>
              </div>
              <p className="text-xs text-gray-400">
                {delivery.enabled ? "Delivery fee is added on the cart page." : "Shipping and taxes calculated at checkout."}
              </p>

              {/* Checkout error */}
              {checkoutError && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-md">
                  {checkoutError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleViewCart}
                  className="flex-1 rounded-lg py-2.5 px-4 text-sm font-medium ring-1 ring-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View Cart
                </button>
                <button
                  className="flex-1 rounded-lg py-2.5 px-4 text-sm font-medium bg-brand-navy text-white hover:bg-brand-gold hover:text-brand-navy transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isLoading || !delivery.loaded}
                  onClick={handleCheckout}
                >
                  {isLoading ? "Loading..." : "Checkout"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartModal;