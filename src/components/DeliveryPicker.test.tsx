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

  it("shows Free instead of a fee on every listed area when the basket qualifies", () => {
    const html = view({ query: "gig", free: true });
    expect(html).toMatch(/Free/);
    expect(html).not.toContain("KES 450");
  });

  it("still shows the fee when the basket does not qualify", () => {
    expect(view({ query: "gig" })).toContain("KES 450");
  });

  it("says the chosen area's delivery is free, in place of a fee of nothing", () => {
    const html = view({ selectedLabel: "Gigiri, Limuru Road", selectedPrice: 0, free: true });
    expect(html).toMatch(/Free delivery/);
    expect(html).not.toContain("KES 0");
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

describe("DeliveryPicker saving", () => {
  it("ignores a second choice while the first is still being saved", () => {
    const source = require("node:fs").readFileSync("src/components/DeliveryPicker.tsx", "utf8") as string;
    expect(source).toMatch(/const pick = async \(area: DeliveryArea\) => {\s*if \(busy\) return;/);
  });
});

describe("DeliveryPickerView list", () => {
  it("scrolls inside its own box, so the page behind it stays still", () => {
    const list = view({ query: "gig" }).match(/<ul[^>]*role="listbox"[^>]*>/)?.[0] ?? "";
    const classes = list.match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
    expect(classes).toContain("overflow-y-auto");
    expect(classes).toContain("overscroll-contain");
    expect(classes.some((c) => /^max-h-/.test(c))).toBe(true);
    expect(classes).not.toContain("overflow-hidden");
  });

  it("shows more than a handful of areas, since the box scrolls", () => {
    const many = areasFromRates(Array.from({ length: 40 }, (_, n) => ({ id: `r${n}`, places: `Thika Spot ${n}`, road: "Thika Road", price: 300 })));
    const html = renderToStaticMarkup(
      <DeliveryPickerView areas={many} query="thika" onQuery={noop} onPick={noop} onChange={noop} busy={false} error={null} />
    );
    expect((html.match(/role="option"/g) ?? []).length).toBeGreaterThan(8);
  });
});

describe("DeliveryPickerView open and closed", () => {
  it("hides the list of areas, and the no-match note, while it is closed, but keeps what was typed", () => {
    const closed = view({ query: "gig", open: false });
    expect(closed).not.toContain('role="listbox"');
    expect(closed).toContain('value="gig"');
    expect(closed).toContain('aria-expanded="false"');
    expect(view({ query: "zzzz", open: false })).not.toMatch(/No area matches/i);
  });

  it("is open by default once two letters are typed", () => {
    expect(view({ query: "gig" })).toContain('role="listbox"');
    expect(view({ query: "gig" })).toContain('aria-expanded="true"');
  });
});

describe("DeliveryPicker", () => {
  it("renders on the server as the empty search, before any scripts run", () => {
    const html = renderToStaticMarkup(<DeliveryPicker areas={areas} selectedLabel={null} selectedPrice={null} onChosen={async () => {}} />);
    expect(html).toContain('role="combobox"');
  });
});
