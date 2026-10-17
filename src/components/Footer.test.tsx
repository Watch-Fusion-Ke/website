import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Footer from "@/components/Footer";

describe("Footer", () => {
  it("shows the current year, not a fixed one", () => {
    expect(renderToStaticMarkup(<Footer />)).toContain(`© ${new Date().getFullYear()} Watch Fusion Kenya`);
  });
});
