import { create } from "zustand";
import { currentCart } from "@wix/ecom";
import { WixClient } from "@/context/wixContext";
import { isDeliveryLine } from "@/lib/delivery";

// The number shown on the cart badge: products only, not the delivery fee line.
const productCount = (cart?: { lineItems?: { productName?: { original?: string | null } | null }[] } | null) =>
  (cart?.lineItems ?? []).filter((item) => !isDeliveryLine(item)).length;

type CartState = {
  cart: currentCart.Cart & { 
    subtotal?: { amount: string; formattedAmount: string };
    priceSummary?: { subtotal?: { amount: string; formattedAmount: string } };
  };
  isLoading: boolean;
  counter: number;
  getCart: (wixClient: WixClient) => void;
  addItem: (
    wixClient: WixClient,
    productId: string,
    variantId: string,
    quantity: number
  ) => void;
  removeItem: (wixClient: WixClient, itemId: string) => void;
};

export const useCartStore = create<CartState>((set) => ({
  cart: {} as any,
  isLoading: false,
  counter: 0,
  getCart: async (wixClient) => {
    try {
      const cart = await wixClient.currentCart.getCurrentCart();
      set({
        cart: cart || {} as any,
        isLoading: false,
        counter: productCount(cart),
      });
    } catch (err) {
      set((prev) => ({ ...prev, isLoading: false }));
    }
  },
  addItem: async (wixClient, productId, variantId, quantity) => {
    set((state) => ({ ...state, isLoading: true }));
    try {
      const response = await wixClient.currentCart.addToCurrentCart({
        lineItems: [
          {
            catalogReference: {
              appId: process.env.NEXT_PUBLIC_WIX_APP_ID!,
              catalogItemId: productId,
              ...(variantId &&
                variantId !== "00000000-0000-0000-0000-000000000000" && {
                  options: { variantId },
                }),
            },
            quantity: quantity,
          },
        ],
      });

      set({
        cart: response.cart,
        counter: productCount(response.cart),
        isLoading: false,
      });
    } catch (err) {
      console.error(err);
      set((state) => ({ ...state, isLoading: false }));
    }
  },
  removeItem: async (wixClient, itemId) => {
    set((state) => ({ ...state, isLoading: true }));
    const response = await wixClient.currentCart.removeLineItemsFromCurrentCart(
      [itemId]
    );

    set({
      cart: response.cart,
      counter: productCount(response.cart),
      isLoading: false,
    });
  },
}));
