import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hideWhileScrolling = vi.hoisted(() => vi.fn(() => () => {}));
vi.mock("@/lib/scrollHider", () => ({ hideWhileScrolling }));
// Run effects at once, since the server renderer never runs them.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useEffect: (effect: () => void) => effect(),
}));

import WhatsAppButton from "@/components/WhatsAppButton";

beforeEach(() => {
  hideWhileScrolling.mockClear();
  vi.stubGlobal("window", new EventTarget());
});

describe("WhatsAppButton", () => {
  it("listens for the page scrolling and starts visible", () => {
    const html = renderToStaticMarkup(<WhatsAppButton />);
    expect(hideWhileScrolling).toHaveBeenCalledTimes(1);
    expect(hideWhileScrolling).toHaveBeenCalledWith(globalThis.window, expect.any(Function));
    expect(html).toContain("opacity-100");
  });
});
