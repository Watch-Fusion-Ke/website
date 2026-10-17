import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ContactPage from "@/app/contact/page";

const html = renderToStaticMarkup(<ContactPage />);
const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

describe("Contact page", () => {
  it("shows none of the template's sample details", () => {
    for (const sample of ["support@store.com", "sales@store.com", "+254 700 000 000", "Westlands", 'href="#"']) {
      expect(html).not.toContain(sample);
    }
  });

  it("shows the shop's real address and opening hours", () => {
    expect(html).toContain("Stanbank House");
    expect(html).toContain("Moi Avenue");
    expect(text).toMatch(/Mon to Fri 8:30am to 7pm/);
    expect(text).toMatch(/Sat 10am to 7pm/);
    expect(text).toMatch(/Sun Closed/i);
  });

  it("links the real WhatsApp number, phone, email, Instagram and TikTok", () => {
    expect(html).toContain('href="https://wa.me/254796044969"');
    expect(html).toContain('href="tel:+254796044969"');
    expect(html).toContain("0796 044 969");
    expect(html).toContain('href="mailto:watchfusionkenya@gmail.com"');
    expect(html).toContain('href="https://www.instagram.com/watchfusion_kenya"');
    expect(html).toContain('href="https://www.tiktok.com/@watchfusion_kenya"');
  });

  it("has no message form that pretends to send, until a real one is connected", () => {
    expect(html).not.toContain("<form");
    expect(html).not.toMatch(/sent successfully|message has been sent/i);
  });

  it("makes no delivery, returns or free shipping promise that the shop has not confirmed", () => {
    expect(html).not.toMatch(/free (delivery|shipping)/i);
    expect(html).not.toMatch(/30-day|3-7 business|international/i);
  });

  it("says delivery is not free and depends on the area", () => {
    expect(html).toMatch(/not free/i);
  });

  it("has one main heading in the title face, and no pink", () => {
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*font-display/);
    expect(html).not.toMatch(/pink|purple|F35C7A/i);
  });

  it("opens outside links in a new tab without handing over the page", () => {
    const outside = html.match(/<a [^>]*href="https:\/\/[^"]*"[^>]*>/g) ?? [];
    expect(outside.length).toBeGreaterThan(0);
    for (const tag of outside) {
      expect(tag).toContain('target="_blank"');
      expect(tag).toContain('rel="noopener noreferrer"');
    }
  });
});
