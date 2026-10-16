"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useWixClient } from "@/hooks/useWixClient";
import { useCartStore } from "@/hooks/useCartStore";

// Cart shortcut for the phone header. The desktop header has its own cart popup in NavIcons.
const MobileCartLink = () => {
  const wixClient = useWixClient();
  const { counter, getCart } = useCartStore();

  useEffect(() => {
    getCart(wixClient);
  }, [wixClient, getCart]);

  return (
    <Link
      href="/cart"
      aria-label={counter > 0 ? `Cart, ${counter} items` : "Cart"}
      className="relative ml-auto p-2"
    >
      <Image src="/cart.png" alt="" width={24} height={24} />
      {counter > 0 && (
        <span className="absolute top-0 -right-1 min-w-5 h-5 px-1 rounded-full bg-yellow-400 text-gray-900 text-xs font-bold flex items-center justify-center">
          {counter}
        </span>
      )}
    </Link>
  );
};

export default MobileCartLink;
