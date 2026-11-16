"use client";

import { categoryHref } from "@/lib/categoryPages";
import { drawerMenu } from "@/lib/siteMenu";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAllCategories } from "@/hooks/useCategories";
import { useRouter } from "next/navigation";
import { useWixClient } from "@/hooks/useWixClient";
import { useCartStore } from "@/hooks/useCartStore";
import Cookies from "js-cookie";

const Menu = () => {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const allCats = useAllCategories();
  // The categories arrive soon after the page loads and stay, so the lists do not collapse while the drawer slides shut. The pages are
  // there from the start.
  const { sections, pages } = useMemo(
    () => drawerMenu(allCats.map((c) => ({ name: c.name ?? "", slug: c.slug ?? "", visible: c.visible }))),
    [allCats]
  );
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

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

  // While the drawer is open it is a modal: the keyboard moves into it and stays there (Tab goes round), Escape closes it, the page
  // behind does not scroll, and closing returns the keyboard to the button that opened it.
  useEffect(() => {
    if (!open) {
      if (wasOpen.current) openerRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // The drawer is still invisible at the start of its slide-in, and a hidden control cannot take focus, so wait a moment.
    const timer = setTimeout(() => closeRef.current?.focus(), 60);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      // Only controls that are really shown count: the links of a folded group are not.
      const controls = Array.prototype.slice
        .call(dialogRef.current.querySelectorAll("a[href], button:not([disabled]), summary"))
        .filter((el: HTMLElement) => el.offsetParent !== null);
      if (controls.length === 0) return;
      const first = controls[0] as HTMLElement;
      const last = controls[controls.length - 1] as HTMLElement;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="relative">
      {/* Menu button: sits on the left of the phone header */}
      <button
        ref={openerRef}
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
        ref={dialogRef}
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
            ref={closeRef}
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
          {/* Categories, in the same order as the row on the home page */}
          {sections.length > 0 && (
            <div>
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">Shop by Category</p>
              {sections.map((section, i) => {
                const links = section.links.map((link) => (
                  <Link
                    key={link.slug}
                    href={categoryHref(link.slug)}
                    onClick={close}
                    className={`block text-base font-medium text-gray-800 hover:text-black hover:bg-gray-50 py-3 rounded-lg transition-colors ${link.depth === 1 ? "pl-8 pr-3 text-sm" : "px-3"}`}
                  >
                    {link.name}
                  </Link>
                ));
                // A group (Watch Brands) is folded away until tapped, as the row's dropdown is, so its many brands do not push the rest down.
                return section.heading ? (
                  <details key={section.heading} className="group">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3 text-base font-medium text-gray-800 transition-colors hover:bg-gray-50 hover:text-black [&::-webkit-details-marker]:hidden">
                      {section.heading}
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </summary>
                    {links}
                  </details>
                ) : (
                  <div key={`links-${i}`}>{links}</div>
                );
              })}
            </div>
          )}

          {/* The site's own pages, the same as the row's More menu */}
          {pages.length > 0 && (
            <div className={sections.length > 0 ? "mt-4 pt-4 border-t border-gray-100" : undefined}>
              {pages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  onClick={close}
                  className="block text-base font-medium text-gray-800 hover:text-black hover:bg-gray-50 px-3 py-3 rounded-lg transition-colors"
                >
                  {page.name}
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
