import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookieGet, getCurrentMember } = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  getCurrentMember: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: () => ({ get: cookieGet }) }));
vi.mock("@/lib/wixClientServer", () => ({
  wixClientServer: async () => ({ members: { getCurrentMember } }),
}));

import GiftVouchersPage from "@/app/gift-vouchers/page";

describe("gift voucher member phone", () => {
  beforeEach(() => {
    cookieGet.mockReset();
    getCurrentMember.mockReset();
  });

  it("prefills the sender phone from a signed-in member's saved profile", async () => {
    cookieGet.mockReturnValue({ value: JSON.stringify({ role: "member" }) });
    getCurrentMember.mockResolvedValue({ member: { contact: { phones: ["+254 712 345 678"] } } });
    const html = renderToStaticMarkup(await GiftVouchersPage());
    expect(html).toMatch(/name="senderPhone"[^>]*value="\+254 712 345 678"/);
    expect(html).toContain('name="recipientPhone"');
    expect(getCurrentMember).toHaveBeenCalledOnce();
  });

  it("leaves the sender phone editable and empty for a visitor", async () => {
    const html = renderToStaticMarkup(await GiftVouchersPage());
    expect(html).toMatch(/name="senderPhone"[^>]*value=""/);
    expect(getCurrentMember).not.toHaveBeenCalled();
  });
});
