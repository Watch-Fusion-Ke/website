"use client";

import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useEffect, useState } from "react";
import { useAllCategories } from "@/hooks/useCategories";
import { useRouter } from "next/navigation";
import { useWixClient } from "@/hooks/useWixClient";
import { useCartStore } from "@/hooks/useCartStore";
import Cookies from "js-cookie";

type Category = { _id?: string | null; name?: string | null; slug?: string | null };

const Menu = () => {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const allCats = useAllCategories();
  const cats: Category[] = open ? allCats : [];

  const router = useRouter();
  const wixClient = useWixClient();
  const isLoggedIn = wixClient.auth.loggedIn();
  const { counter } = useCartStore();

  const handleLogout = async () => {
    setLoggingOut(true);
    Cookies.remove("refreshToken");
    const { logoutUrl } = await wixClient.auth.logout(window.location.href);
    setLoggingOut(false);
    setOpen(false);
    router.push(logoutUrl);
  };

  const close = () => setOpen(false);

  // Escape closes the menu
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const navLinks = [
    { label: "Homepage", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: "Deals", href: "/deals" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <div className="relative">
      {/* Menu button: sits on the left of the phone header */}
      <button
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex flex-col justify-center items-center w-10 h-10 gap-1.5"
      >
        <span className="block h-0.5 w-6 bg-current" />
        <span className="block h-0.5 w-6 bg-current" />
        <span className="block h-0.5 w-6 bg-current" />
      </button>

      {/* Overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Slide-in drawer from the left. No shadow while closed, so nothing leaks onto the page edge. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`fixed top-0 left-0 h-full w-72 pl-[env(safe-area-inset-left)] bg-white z-50 flex flex-col transition-[transform,visibility] duration-300 ease-in-out ${
          open ? "visible translate-x-0 shadow-2xl" : "invisible -translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <span className="font-bold text-lg tracking-wide">Menu</span>
          <button
            onClick={close}
            aria-label="Close menu"
            className="text-gray-400 hover:text-black transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Theme switch */}
        <div className="px-6 pt-4">
          <ThemeToggle showLabel />
        </div>

        {/* Nav links */}
        <nav className="flex flex-col px-6 py-6 gap-1 flex-1 overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-base font-medium text-gray-800 hover:text-black hover:bg-gray-50 px-3 py-3 rounded-lg transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {/* Categories */}
          {cats.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Shop by Category
              </p>
              {cats.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/list?cat=${cat.slug}`}
                  onClick={close}
                  className="block text-base font-medium text-gray-800 hover:text-black hover:bg-gray-50 px-3 py-3 rounded-lg transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {/* Cart link with live counter */}
          <Link
            href="/cart"
            onClick={close}
            className="flex items-center justify-between text-base font-medium text-gray-800 hover:text-black hover:bg-gray-50 px-3 py-3 rounded-lg transition-colors"
          >
            <span>Cart</span>
            {counter > 0 && (
              <span className="bg-brand-gold text-gray-900 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {counter}
              </span>
            )}
          </Link>
        </nav>

        {/* Auth section at bottom */}
        <div className="px-6 py-6 border-t border-gray-100 flex flex-col gap-3">
          {isLoggedIn ? (
            <>
              <Link
                href="/profile"
                onClick={close}
                className="text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-50 px-3 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full text-sm font-semibold text-white bg-brand-navy hover:bg-brand-gold hover:text-brand-navy px-4 py-3 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={close}
              className="w-full text-sm font-semibold text-white bg-brand-navy hover:bg-brand-gold hover:text-brand-navy px-4 py-3 rounded-lg transition-colors text-center"
            >
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;