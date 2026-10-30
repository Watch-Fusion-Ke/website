import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GiftVouchersPage from "@/app/gift-vouchers/page";

describe("gift voucher request page", () => {
  const html = renderToStaticMarkup(<GiftVouchersPage />);

  it("asks for only the sender's name before the recipient details", () => {
    expect(html).toContain('name="senderName"');
    expect(html).not.toContain('name="senderPhone"');
    expect(html).not.toMatch(/Your phone|Sender phone/i);
  });

  it("groups the recipient's name, phone and email under one heading", () => {
    const details = html.match(/<fieldset[\s\S]*?<\/fieldset>/)?.[0] ?? "";
    expect(details).toMatch(/<legend[^>]*>Recipient details<\/legend>/);
    expect(details).toContain('name="recipientName"');
    expect(details).toContain('name="recipientPhone"');
    expect(details).toContain('name="recipientEmail"');
    expect(details).toMatch(/>Name<\/label>[\s\S]*>Phone number<\/label>[\s\S]*>Email address<\/label>/);
  });
});
