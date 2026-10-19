// The Wix Stores app. Every product in the shop's cart is a catalog item that comes from it, so adding to the cart needs this
// id. It is the same for every Wix site (it is the id in Wix's own cart examples), so it is fixed here and not read from a
// setting. When it was a setting, the OAuth client id was pasted into it by mistake, and Wix then answered "added" with an empty cart.
// Docs: https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/purchase-flow/cart-v2/add-line-items-to-current-cart
export const STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";
