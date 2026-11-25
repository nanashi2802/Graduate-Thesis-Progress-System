// Theme choice (UX-D-01, DESIGN.md §7.3). The OS setting is the default. A stored choice overrides it.
// No next-themes: THEME_SCRIPT runs inline before the first paint. If a CSP with `script-src` is added
// later, it needs a hash for this script.

export type ThemeChoice = "light" | "dark" | "system";
export const THEME_KEY = "theme";
export const THEME_CHOICES: readonly ThemeChoice[] = ["light", "dark", "system"];

export function resolveTheme(choice: ThemeChoice | null, prefersDark: boolean): "light" | "dark" {
  if (choice === "light" || choice === "dark") return choice;
  return prefersDark ? "dark" : "light";
}

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "light" || value === "dark" || value === "system";
}

/** Set the theme on <html>: the `dark` class and `color-scheme`. */
export function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

// Plain ES5, no imports: it runs as an inline <script> before React loads.
export const THEME_SCRIPT = `(function(){var c=null;try{c=localStorage.getItem(${JSON.stringify(THEME_KEY)})}catch(e){}if(c!=="light"&&c!=="dark")c=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";var h=document.documentElement;h.classList.toggle("dark",c==="dark");h.style.colorScheme=c})();`;
