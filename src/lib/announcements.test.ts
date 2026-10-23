import { describe, expect, it } from "vitest";
import { WHATSAPP_NUMBER } from "@/lib/contact";
import { ANNOUNCEMENTS, engravingUrl } from "@/lib/announcements";

describe("the announcements", () => {
  it("say the shop offers custom engraving, and that deliveries can be the same day", () => {
    const texts = ANNOUNCEMENTS.map((a) => a.text);
    expect(texts).toContain("We offer custom engraving");
    expect(texts).toContain("Same day deliveries");
  });

  it("do not yet promise free delivery, which only goes in once the shop actually gives it", () => {
    expect(ANNOUNCEMENTS.map((a) => a.text.toLowerCase()).join(" ")).not.toContain("free delivery");
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
