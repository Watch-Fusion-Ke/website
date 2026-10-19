import { formatKes } from "@/lib/delivery";
import { WHATSAPP_NUMBER } from "@/lib/contact";

type OrderProduct = { name: string; price?: number; url: string; hasOptions?: boolean };

// The chat the shopper starts when they order on WhatsApp. It names the product and gives the page, so nobody has to describe it.
export const orderMessage = ({ name, price, url, hasOptions }: OrderProduct): string =>
  [
    "Hello Watch Fusion Kenya, I would like to order:",
    "",
    name,
    ...(typeof price === "number" && Number.isFinite(price) && price > 0 ? [`Price: ${formatKes(price)}`] : []),
    url,
    ...(hasOptions ? ["", "Please tell me which options are available."] : []),
  ].join("\n");

// A name from Wix can hold half of an emoji, which encodeURIComponent refuses. Broken characters are replaced first.
const wellFormed = (text: string): string => text.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "\uFFFD");

export const orderUrl = (product: OrderProduct): string =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(wellFormed(orderMessage(product)))}`;
