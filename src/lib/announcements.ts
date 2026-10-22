import { WHATSAPP_NUMBER } from "@/lib/contact";

export type Announcement = { text: string; href?: string };

// The chat a shopper starts from the engraving message: it names what they want, so nobody has to explain.
export const engravingUrl = () =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello Watch Fusion Kenya, I would like custom engraving.")}`;

// The messages that slide across the top of every page, in order. Only what the shop really offers goes here.
// A message with an address is a link; the rest are plain text.
export const ANNOUNCEMENTS: Announcement[] = [
  { text: "We offer custom engraving", href: engravingUrl() },
  { text: "Same day deliveries" },
];
