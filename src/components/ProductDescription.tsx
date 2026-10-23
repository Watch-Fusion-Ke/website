import DOMPurify from "isomorphic-dompurify";
import ProductSpecs from "@/components/ProductSpecs";
import { parseDescription } from "@/lib/productSpecs";

const prose = (html: string) => (
  <div className="text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
);

/** A description with a "Specifications" list is shown as intro, features and a spec table. Any other description is shown as it always was. */
export default function ProductDescription({ html }: { html: string }) {
  const parsed = parseDescription(html);
  if (!parsed) return prose(html);

  return (
    <div className="flex flex-col gap-6">
      {parsed.introHtml && prose(parsed.introHtml)}
      <ProductSpecs specs={parsed.specs} features={parsed.features} />
      {parsed.trailingHtml && prose(parsed.trailingHtml)}
    </div>
  );
}
