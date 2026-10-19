import { formatKes } from "@/lib/delivery";
import { WHATSAPP_NUMBER } from "@/lib/contact";

type OrderProduct = { name: string; price?: number; url: string };

// The chat the shopper starts when they order on WhatsApp. It names the product and gives the page, so nobody has to describe it.
export const orderMessage = ({ name, price, url }: OrderProduct): string =>
  [
    "Hello Watch Fusion Kenya, I would like to order:",
    "",
    name,
    ...(typeof price === "number" && Number.isFinite(price) ? [`Price: ${formatKes(price)}`] : []),
    url,
  ].join("\n");

export const orderUrl = (product: OrderProduct): string =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderMessage(product))}`;
