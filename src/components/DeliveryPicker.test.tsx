import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DeliveryPicker, { DeliveryPickerView } from "@/components/DeliveryPicker";
import { areasFromRates, type DeliveryRate } from "@/lib/delivery";

const rates: DeliveryRate[] = [
  { id: "r1", places: "UNEP / GIGIRI", road: "Limuru Road", price: 450 },
  { id: "r2", places: "KILIMANI", road: "Ngong Road", price: 300 },
];
const areas = areasFromRates(rates);
const noop = () => {};

const view = (extra: Partial<React.ComponentProps<typeof DeliveryPickerView>> = {}) =>
  renderToStaticMarkup(
    <DeliveryPickerView areas={areas} query="" onQuery={noop} onPick={noop} onChange={noop} busy={false} error={null} {...extra} />
  );

describe("DeliveryPickerView", () => {
  it("asks for the area with a visible label, as a search box with a list of choices", () => {
    const html = view();
    expect(html).toMatch(/<label[^>]*>Where should we deliver\?<\/label>/);
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-autocomplete="list"');
  });

  it("shows nothing until the shopper has typed two letters", () => {
    expect(view({ query: "g" })).not.toContain('role="option"');
  });

  it("lists matching areas with their road and fee", () => {
    const html = view({ query: "gig" });
    expect(html).toContain('role="listbox"');
    expect(html).toContain("Gigiri");
    expect(html).toContain("Limuru Road");
    expect(html).toContain("KES 450");
    expect(html.split('role="listbox"')[1]).not.toContain("Kilimani");
  });

  it("says when nothing matches and offers WhatsApp for an area that is not listed", () => {
    const html = view({ query: "zzzz" });
    expect(html).toMatch(/No area matches/i);
    expect(html).toContain("wa.me");
  });

  it("once an area is chosen, shows it with its fee and a way to change it, instead of the search", () => {
    const html = view({ selectedLabel: "Gigiri, Limuru Road", selectedPrice: 450 });
    expect(html).toContain("Gigiri, Limuru Road");
    expect(html).toContain("KES 450");
    expect(html).toMatch(/>Change<\/button>/);
    expect(html).not.toContain('role="combobox"');
  });

  it("tells the shopper about an error and does not hide the search", () => {
    const html = view({ error: "We could not save that." });
    expect(html).toContain("We could not save that.");
    expect(html).toContain('role="alert"');
    expect(html).toContain('role="combobox"');
  });

  it("marks itself busy while a choice is being saved, without taking keyboard focus away from the box", () => {
    const html = view({ query: "gig", busy: true });
    expect(html).toMatch(/aria-busy="true"/);
    expect(html).toMatch(/<input[^>]*readOnly=""|<input[^>]*readonly=""/);
    expect(html).not.toMatch(/<input[^>]*disabled/);
  });

  it("points aria-controls at the list only while the list is there", () => {
    expect(view({ query: "" })).not.toContain("aria-controls");
    expect(view({ query: "gig" })).toContain("aria-controls");
    expect(view({ query: "zzzz" })).not.toContain("aria-controls");
  });

  it("uses no pink and big enough rows to tap", () => {
    const html = view({ query: "gig" });
    expect(html).not.toMatch(/pink|rose/);
    expect(html).toMatch(/role="option"[^>]*class="[^"]*min-h-11/);
  });
});

describe("DeliveryPicker", () => {
  it("renders on the server as the empty search, before any scripts run", () => {
    const html = renderToStaticMarkup(<DeliveryPicker areas={areas} selectedLabel={null} selectedPrice={null} onChosen={async () => {}} />);
    expect(html).toContain('role="combobox"');
  });
});
