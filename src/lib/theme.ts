export type Theme = "light" | "dark";

export const THEME_KEY = "theme";

export const nextTheme = (theme: Theme): Theme => (theme === "dark" ? "light" : "dark");

// Runs in the page head before anything is drawn, so a shopper who chose dark never sees a white flash.
// A saved choice wins. Without one, the phone's own light or dark setting decides.
// The names document, localStorage and matchMedia are the browser's own.
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}`;
