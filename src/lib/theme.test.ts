import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import config from "../../tailwind.config";
import { THEME_KEY, THEME_SCRIPT, nextTheme } from "@/lib/theme";

// Runs the script that sets the theme before the page paints, against a pretend browser.
const run = (opts: { stored?: string | null; prefersDark?: boolean; storageThrows?: boolean }) => {
  const classes = new Set<string>();
  const style: Record<string, string> = {};
  const documentElement = {
    classList: { toggle: (c: string, on: boolean) => (on ? classes.add(c) : classes.delete(c)) },
    style,
  };
  const localStorage = {
    getItem: (k: string) => {
      if (opts.storageThrows) throw new Error("blocked");
      return k === THEME_KEY ? (opts.stored ?? null) : null;
    },
  };
  const matchMedia = () => ({ matches: !!opts.prefersDark });
  new Function("document", "localStorage", "matchMedia", THEME_SCRIPT)({ documentElement }, localStorage, matchMedia);
  return { dark: classes.has("dark"), scheme: style.colorScheme };
};

describe("theme script", () => {
  it("uses the shopper's saved choice first", () => {
    expect(run({ stored: "dark", prefersDark: false }).dark).toBe(true);
    expect(run({ stored: "light", prefersDark: true }).dark).toBe(false);
  });

  it("starts light for everyone who has not chosen, whatever the phone's own setting is", () => {
    expect(run({ stored: null, prefersDark: true }).dark).toBe(false);
    expect(run({ stored: null, prefersDark: false }).dark).toBe(false);
    expect(run({ stored: null, prefersDark: true }).scheme).toBe("light");
  });

  it("goes dark only when the shopper chose dark and it was saved", () => {
    expect(run({ stored: "dark", prefersDark: false }).dark).toBe(true);
  });

  it("tells the browser which scheme the page uses, so scrollbars and form controls match", () => {
    expect(run({ stored: "dark" }).scheme).toBe("dark");
    expect(run({ stored: "light" }).scheme).toBe("light");
  });

  it("does not break the page when storage is blocked", () => {
    expect(() => run({ storageThrows: true, prefersDark: true })).not.toThrow();
    expect(run({ storageThrows: true, prefersDark: true }).dark).toBe(false);
  });

  it("ignores a saved value it does not know", () => {
    expect(run({ stored: "purple", prefersDark: false }).dark).toBe(false);
  });
});

describe("nextTheme", () => {
  it("flips between light and dark", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });
});

// WCAG contrast ratio between two hex colours.
const channel = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const toHex = (triplet: string) => "#" + triplet.split(/\s+/).map((v) => Number(v).toString(16).padStart(2, "0")).join("");

const css = readFileSync("src/app/globals.css", "utf8");
const block = (selector: RegExp) => css.match(selector)?.[1] ?? "";
const vars = (text: string) => Object.fromEntries(Array.from(text.matchAll(/--([\w-]+):\s*([^;]+);/g)).map((m) => [m[1], m[2].trim()]));
const light = vars(block(/:root\s*{([^}]*)}/));
const dark = vars(block(/\.dark\s*{([^}]*)}/));

describe("dark colours", () => {
  it("keep every grey of the light theme exactly as it was", () => {
    const tailwindDefaults: Record<string, string> = {
      "gray-50": "249 250 251", "gray-100": "243 244 246", "gray-200": "229 231 235", "gray-300": "209 213 219",
      "gray-400": "156 163 175", "gray-500": "107 114 128", "gray-600": "75 85 99", "gray-700": "55 65 81",
      "gray-800": "31 41 55", "gray-900": "17 24 39",
    };
    for (const [name, value] of Object.entries(tailwindDefaults)) expect(light[name]).toBe(value);
  });

  it("match the logo's black for the page and keep text readable (at least 7 to 1)", () => {
    expect(dark.page.toLowerCase()).toBe("#0a0a0a");
    expect(contrast(dark.text, dark.page)).toBeGreaterThanOrEqual(7);
    expect(contrast(dark.text, dark.surface)).toBeGreaterThanOrEqual(7);
    expect(contrast(dark.text, dark.card)).toBeGreaterThanOrEqual(7);
  });

  it("let the gold stand out on the dark page, and dark text sit on gold buttons", () => {
    expect(contrast(dark.gold, dark.page)).toBeGreaterThanOrEqual(7);
    expect(contrast(dark["on-gold"], dark.gold)).toBeGreaterThanOrEqual(7);
  });

  it("keep grey text readable on every dark surface it sits on (at least 4.5 to 1)", () => {
    for (const surface of [dark.page, dark.surface, dark.card, toHex(dark["gray-100"])]) {
      expect(contrast(toHex(dark["gray-400"]), surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(toHex(dark["gray-500"]), surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(toHex(dark["gray-700"]), surface)).toBeGreaterThanOrEqual(7);
    }
  });

  it("keep disabled button text readable on its grey (at least 4.5 to 1)", () => {
    expect(contrast(toHex(dark["gray-500"]), toHex(dark["gray-200"]))).toBeGreaterThanOrEqual(4.5);
  });

  it("run the greys from dark to light so every existing grey class flips by itself", () => {
    const l = (k: string) => luminance(toHex(dark[k]));
    const order = ["gray-50", "gray-100", "gray-200", "gray-300", "gray-400", "gray-500", "gray-600", "gray-700", "gray-800", "gray-900"];
    for (let i = 1; i < order.length; i++) expect(l(order[i])).toBeGreaterThan(l(order[i - 1]));
  });
});

describe("tailwind theme for dark mode", () => {
  it("switches on a class on the page, which the toggle sets", () => {
    expect(config.darkMode).toBe("class");
  });

  it("reads the greys from the page's colour variables", () => {
    const gray = (config.theme?.extend as { colors?: { gray?: Record<string, string> } })?.colors?.gray ?? {};
    expect(gray["100"]).toBe("rgb(var(--gray-100) / <alpha-value>)");
    expect(Object.keys(gray)).toHaveLength(10);
  });
});

describe("dark rules for black text", () => {
  it("turn black text light, but keep it dark on a gold background", () => {
    expect(css).toMatch(/\.dark \.text-black[^{]*{[^}]*color:\s*var\(--text\)/);
    expect(css).toMatch(/\.dark \.bg-brand-gold\.text-black[^{]*{[^}]*color:\s*var\(--on-gold\)/);
  });
});

describe("dark rules for gold backgrounds", () => {
  it("keep the text on every gold background dark, whichever text colour the light theme gave it", () => {
    for (const cls of ["text-gray-900", "text-black", "text-brand-navy"]) {
      expect(css).toContain(`.dark .bg-brand-gold.${cls}`);
    }
    expect(css).toMatch(/\.dark \.bg-brand-gold\s*{[^}]*color:\s*var\(--on-gold\)/);
  });

  it("give the choice pills on the product page their own colours for each theme", () => {
    for (const name of ["choice-bg", "choice-text", "choice-on-bg", "choice-on-text"]) {
      expect(light[name]).toBeTruthy();
      expect(dark[name]).toBeTruthy();
    }
    expect(contrast(dark["choice-on-text"], dark["choice-on-bg"])).toBeGreaterThanOrEqual(7);
    expect(contrast(dark["choice-text"], dark["choice-bg"])).toBeGreaterThanOrEqual(7);
  });
});

describe("navy hover text", () => {
  it("is used only together with a gold hover background, since dark mode turns it dark", () => {
    const { readdirSync } = require("node:fs") as typeof import("node:fs");
    const { join } = require("node:path") as typeof import("node:path");
    const files = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? files(join(dir, e.name)) : /\.tsx$/.test(e.name) && !/\.test\./.test(e.name) ? [join(dir, e.name)] : []
      );
    const bad: string[] = [];
    for (const f of files("src")) {
      readFileSync(f, "utf8").split("\n").forEach((line, i) => {
        if (/hover:text-brand-navy/.test(line) && !/hover:bg-brand-gold/.test(line)) bad.push(`${f}:${i + 1}`);
      });
    }
    expect(bad).toEqual([]);
  });
});

describe("calm gold in the dark theme", () => {
  const hexToTriplet = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");

  it("is a softer gold than the bright yellow of the light theme, and still clearly readable on black", () => {
    expect(dark.gold.toLowerCase()).not.toBe(light.gold.toLowerCase());
    expect(contrast(dark.gold, dark.page)).toBeGreaterThanOrEqual(7);
  });

  it("is the same colour whether a rule uses the hex or the Tailwind colour", () => {
    expect(dark["gold-rgb"]).toBe(hexToTriplet(dark.gold));
    expect(light["gold-rgb"]).toBe(hexToTriplet(light.gold));
  });

  it("lets every gold class of the site follow the theme, through the Tailwind colour", () => {
    const gold = (config.theme?.extend as { colors?: { brand?: Record<string, string> } })?.colors?.brand?.gold;
    expect(gold).toBe("rgb(var(--gold-rgb) / <alpha-value>)");
  });

  it("has no glow around buttons or gold marks", () => {
    expect(css).not.toMatch(/box-shadow:\s*0 0 \d+px rgb\(\s*(249|226)/);
  });

  it("draws buttons that were navy as a thin gold outline with gold text, filling with gold only on hover", () => {
    const rule = css.match(/\.dark \.bg-brand-navy\s*{([^}]*)}/)?.[1] ?? "";
    expect(rule).toMatch(/color:\s*var\(--gold\)/);
    expect(rule).toMatch(/box-shadow:\s*inset 0 0 0 1px/);
    expect(rule).not.toMatch(/background-color:\s*var\(--gold\)/);
    expect(css).toMatch(/\.dark \.bg-brand-navy:hover[^{]*{[^}]*background-color:\s*var\(--gold\)/);
  });

  it("shows prices and link text in the soft white, keeping gold for the accents", () => {
    const rule = css.match(/\.dark \.text-brand-navy\s*{([^}]*)}/)?.[1] ?? "";
    expect(rule).toMatch(/color:\s*var\(--text\)/);
  });
});

describe("globals.css", () => {
  it("has every block closed, since an unclosed block stops the whole site from building", () => {
    const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
    expect((text.match(/{/g) ?? []).length).toBe((text.match(/}/g) ?? []).length);
  });
});
