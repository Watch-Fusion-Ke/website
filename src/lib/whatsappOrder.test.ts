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

describe("orderUrl", () => {
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
