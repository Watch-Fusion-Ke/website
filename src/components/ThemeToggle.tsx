"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@/components/icons";
import { THEME_KEY, nextTheme, type Theme } from "@/lib/theme";

// Every switch on the page (header, menu) reads the same fact, the page's own "dark" class, so they never disagree.
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
};
const isDark = () => document.documentElement.classList.contains("dark");
const isDarkOnServer = () => false;

// Switches between the light and the dark theme. Which icon shows is decided by CSS alone (the page's
// "dark" class), so the right one is there from the first paint. The choice is remembered on this phone.
const ThemeToggle = ({ showLabel = false }: { showLabel?: boolean }) => {
  const dark = useSyncExternalStore(subscribe, isDark, isDarkOnServer);

  const toggle = () => {
    const theme: Theme = nextTheme(dark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Storage can be blocked. The choice then lasts until the page is reloaded.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      {...(showLabel ? {} : { "aria-label": "Dark mode", "aria-pressed": dark })}
      className={`flex items-center gap-2 h-11 text-gray-800 hover:bg-gray-100 transition-colors ${showLabel ? "w-full justify-start rounded-lg px-4" : "w-11 justify-center rounded-full"}`}
    >
      <MoonIcon className="w-6 h-6 dark:hidden" />
      <SunIcon className="w-6 h-6 hidden dark:block text-brand-gold" />
      {showLabel && (
        <span className="text-base font-medium">
          <span className="dark:hidden">Dark mode</span>
          <span className="hidden dark:inline">Light mode</span>
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
