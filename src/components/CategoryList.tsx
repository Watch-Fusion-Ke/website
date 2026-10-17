import { wixClientServer } from "@/lib/wixClientServer";
import Link from "next/link";

const CategoryList = async () => {
  const wixClient = await wixClientServer();
  const cats = await wixClient.collections.queryCollections().find();

  return (
    <div className="py-4 md:py-8">
      {/* Mobile: horizontal scroll strip */}
      <div className="relative md:hidden">
        <div className="flex gap-3 px-4 pr-10 overflow-x-auto scrollbar-hide">
          {cats.items.map((item) => (
            <Link
              href={`/list?cat=${item.slug}`}
              key={item._id}
              className="flex-shrink-0 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-black hover:text-white hover:border-black transition-colors duration-200 whitespace-nowrap"
            >
              {item.name}
            </Link>
          ))}
        </div>
        {/* Right-edge fade + chevron: hints that the strip scrolls */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-end w-14 bg-gradient-to-l from-white via-white/80 to-transparent">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mr-1">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* Tablet & Desktop: centered row */}
      <div className="hidden md:flex justify-center items-center gap-8 md:gap-12 lg:gap-16 px-4 overflow-x-auto scrollbar-hide">
        {cats.items.map((item) => (
          <Link
            href={`/list?cat=${item.slug}`}
            className="flex-shrink-0 group"
            key={item._id}
          >
            <h1
              className="text-lg md:text-xl font-semibold text-gray-800 hover:underline underline-offset-4 decoration-2 decoration-brand-gold transition-colors duration-200 whitespace-nowrap"
              style={{ fontFamily: "Futura, sans-serif", lineHeight: "25.5px" }}
            >
              {item.name}
            </h1>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;