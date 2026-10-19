import { describe, expect, it } from "vitest";
import { orderMessage, orderUrl } from "@/lib/whatsappOrder";
import { WHATSAPP_NUMBER } from "@/lib/contact";

const product = { name: "Naviforce NF9269 Men's Silver Dial Watch", price: 3500, url: "https://www.watchfusionkenya.com/naviforce-nf9269" };

describe("orderMessage", () => {
  it("names the product, the price and the page, so the shop knows exactly what is wanted", () => {
    const text = orderMessage(product);
    expect(text).toContain("Naviforce NF9269 Men's Silver Dial Watch");
    expect(text).toContain("KES 3,500");
    expect(text).toContain("https://www.watchfusionkenya.com/naviforce-nf9269");
    expect(text).toMatch(/order/i);
  });

  it("leaves the price out when there is none rather than writing a wrong one", () => {
    const text = orderMessage({ ...product, price: undefined });
    expect(text).not.toMatch(/KES|NaN|undefined/);
  });

  it("keeps each part on its own line", () => {
    expect(orderMessage(product).split("\n").length).toBeGreaterThanOrEqual(4);
  });
});

describe("orderMessage options and odd values", () => {
  it("asks the shop to confirm the choice when the product has options, since the link cannot know the shopper's choice", () => {
    expect(orderMessage({ ...product, hasOptions: true })).toMatch(/which option|options/i);
    expect(orderMessage(product)).not.toMatch(/option/i);
  });

  it("leaves out a price of zero or below, which is never a real price", () => {
    expect(orderMessage({ ...product, price: 0 })).not.toMatch(/KES/);
    expect(orderMessage({ ...product, price: -5 })).not.toMatch(/KES/);
  });
});

describe("orderUrl", () => {
  it("still makes a link when a name holds a broken character such as half an emoji", () => {
    const broken = `Gift set \uD83D`;
    expect(() => orderUrl({ ...product, name: broken })).not.toThrow();
    expect(new URL(orderUrl({ ...product, name: broken })).searchParams.get("text")).toContain("Gift set");
  });

  it("opens a chat with the shop's number and the message ready to send", () => {
    const url = orderUrl(product);
    expect(url.startsWith(`https://wa.me/${WHATSAPP_NUMBER}?text=`)).toBe(true);
    const text = new URL(url).searchParams.get("text");
    expect(text).toBe(orderMessage(product));
  });

  it("encodes characters that would break the link, such as & # and quotes", () => {
    const url = orderUrl({ ...product, name: `Gift & "Set" #1` });
    expect(url).not.toMatch(/\s/);
    expect(url).not.toContain('"');
    expect(url.split("?")[1]).not.toContain("#");
    expect(new URL(url).searchParams.get("text")).toContain(`Gift & "Set" #1`);
  });
});
