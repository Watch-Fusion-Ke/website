export type SpecRow = { label: string; value: string };

export type ParsedDescription = {
  introHtml: string;
  features: string[];
  specs: SpecRow[];
  trailingHtml: string;
};

// A heading is a short paragraph (or h2 to h6) holding only the words, with or without bold around them.
const heading = (words: string) =>
  new RegExp(`<(p|h[2-6])\\b[^>]*>\\s*(?:<(?:span|strong|b)\\b[^>]*>\\s*)*(?:${words}):?\\s*(?:</(?:span|strong|b)>\\s*)*</\\1>`, "i");

const SPECS_HEADING = heading("Specifications");
const FEATURES_HEADING = heading("Key features");
const LIST = /^\s*<ul\b[^>]*>([\s\S]*?)<\/ul>/i;

const ENTITIES: Record<string, string> = { nbsp: " ", quot: '"', apos: "'", lt: "<", gt: ">" };

const codePoint = (code: number, whole: string) => (code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole);

const toText = (html: string) =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
      if (/^#x/i.test(name)) return codePoint(parseInt(name.slice(2), 16), whole);
      if (name.startsWith("#")) return codePoint(Number(name.slice(1)), whole);
      return name.toLowerCase() === "amp" ? whole : (ENTITIES[name.toLowerCase()] ?? whole);
    })
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();

const itemsOf = (listInner: string) => Array.from(listInner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi), (m) => toText(m[1]));

/**
 * Splits the description Wix sends into its intro, key features and spec rows, so the page can show the specs as a table.
 * Returns null when the description has no "Specifications" list, or when a line in it is not "label: value",
 * so the page can show the description exactly as before and no text is lost.
 */
export function parseDescription(html: string): ParsedDescription | null {
  const specsHeading = SPECS_HEADING.exec(html);
  if (!specsHeading) return null;

  const afterHeading = html.slice(specsHeading.index + specsHeading[0].length);
  const list = LIST.exec(afterHeading);
  if (!list) return null;

  const specs: SpecRow[] = [];
  for (const line of itemsOf(list[1])) {
    const colon = line.indexOf(":");
    const label = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    if (colon < 1 || !label || !value) return null;
    specs.push({ label, value });
  }
  if (specs.length === 0) return null;

  const before = html.slice(0, specsHeading.index);
  let introHtml = before;
  let features: string[] = [];
  const featuresHeading = FEATURES_HEADING.exec(before);
  if (featuresHeading) {
    const featuresList = LIST.exec(before.slice(featuresHeading.index + featuresHeading[0].length));
    const onlyThatList = featuresList && before.slice(featuresHeading.index + featuresHeading[0].length + featuresList[0].length).trim() === "";
    if (featuresList && onlyThatList) {
      features = itemsOf(featuresList[1]).filter(Boolean);
      introHtml = before.slice(0, featuresHeading.index);
    }
  }

  return {
    introHtml: introHtml.trim(),
    features,
    specs,
    trailingHtml: afterHeading.slice(list[0].length).trim(),
  };
}
