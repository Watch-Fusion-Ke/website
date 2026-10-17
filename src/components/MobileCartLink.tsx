"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/hooks/useCartStore";

// Cart shortcut for the phone header. NavIcons is mounted on every screen size (hidden by CSS on phones)
// and loads the cart into the store, so this only reads the item count.
const MobileCartLink = () => {
  const { counter } = useCartStore();

  return (
    <Link
      href="/cart"
      aria-label={counter > 0 ? `Cart, ${counter} items` : "Cart"}
      className="relative p-2"
    >
      <Image src="/cart.png" alt="" width={24} height={24} className="dark:invert" />
      {counter > 0 && (
        <span className="absolute top-0 -right-1 min-w-5 h-5 px-1 rounded-full bg-brand-gold text-gray-900 text-xs font-bold flex items-center justify-center">
          {counter}
        </span>
      )}
    </Link>
  );
};

export default MobileCartLink;
