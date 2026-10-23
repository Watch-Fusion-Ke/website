import { describe, expect, it } from "vitest";
import { WHATSAPP_NUMBER } from "@/lib/contact";
import { ANNOUNCEMENTS, engravingUrl } from "@/lib/announcements";
import { FREE_DELIVERY_FROM } from "@/lib/delivery";

describe("the announcements", () => {
  it("say the shop offers custom engraving, and that deliveries can be the same day", () => {
    const texts = ANNOUNCEMENTS.map((a) => a.text);
    expect(texts).toContain("We offer custom engraving");
    expect(texts).toContain("Same day deliveries");
  });

  it("promise free delivery from Ksh 10,000, the amount the cart gives it at", () => {
    expect(ANNOUNCEMENTS.map((a) => a.text)).toContain("Free delivery on orders from Ksh 10,000");
    expect(FREE_DELIVERY_FROM).toBe(10000);
  });

  it("send the engraving message to WhatsApp, with the shop's number and a ready message", () => {
    const link = ANNOUNCEMENTS.find((a) => a.text === "We offer custom engraving")?.href;
    expect(link).toBe(engravingUrl());
    const url = new URL(engravingUrl());
    expect(url.origin + url.pathname).toBe(`https://wa.me/${WHATSAPP_NUMBER}`);
    expect(url.searchParams.get("text")).toBe("Hello Watch Fusion Kenya, I would like custom engraving.");
  });

  it("leave the other messages as plain text, not links", () => {
    expect(ANNOUNCEMENTS.find((a) => a.text === "Same day deliveries")?.href).toBeUndefined();
  });
});
