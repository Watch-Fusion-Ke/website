"use client";

import Link from "next/link";
import useCategories from "@/hooks/useCategories";

const link = "block py-1.5 text-sm text-gray-400 transition-colors hover:text-white";

// The footer's Shop column. The whole-shop link is there from the first paint, and the categories
// join it a moment later, so the footer never holds up the page.
const FooterShopLinks = () => {
  const categories = useCategories(6);
  return (
    <ul>
      <li><Link href="/shop" className={link}>All products</Link></li>
      {categories.map((c) => (
        <li key={c.slug}>
          <Link href={`/shop?cat=${c.slug}`} className={link}>{c.name}</Link>
        </li>
      ))}
    </ul>
  );
};

export default FooterShopLinks;
