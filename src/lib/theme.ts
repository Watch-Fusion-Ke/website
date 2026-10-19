export type Theme = "light" | "dark";

export const THEME_KEY = "theme";

export const nextTheme = (theme: Theme): Theme => (theme === "dark" ? "light" : "dark");

// Runs in the page head before anything is drawn, so a shopper who chose dark never sees a white flash.
// The page starts light for everyone. It goes dark only when the shopper switched it on and it was saved,
// whatever the phone's own light or dark setting is.
// The names document and localStorage are the browser's own.
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");var d=t==="dark";document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}`;
