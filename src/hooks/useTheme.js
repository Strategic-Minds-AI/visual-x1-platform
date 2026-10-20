import { useCallback, useEffect, useState } from "react";

// The theme is a single persisted setting for the whole system. index.html
// applies it before the first paint; this module is the only place that writes
// it afterwards, and it keeps every surface the app reads in step: the <html>
// class, color-scheme, the canvas colour behind the first paint, and storage.
const KEY = "visualx-theme";
const EVENT = "visualx-theme-change";
const DEFAULT_THEME = "dark";
const CANVAS = "#02050d";

const isBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";

// The stored preference, falling back to the class the pre-paint bootstrap in
// index.html already put on <html>, so a first-time visitor reads the same
// theme the page is actually rendering.
export function readTheme() {
  if (!isBrowser()) return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    /* storage unavailable */
  }
  return document.documentElement.classList.contains("dark") ? "dark" : DEFAULT_THEME;
}

export function applyTheme(theme) {
  if (!isBrowser()) return;
  const resolved = theme === "light" ? "light" : "dark";
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  root.style.backgroundColor = resolved === "dark" ? CANVAS : "";
  try {
    window.localStorage.setItem(KEY, resolved);
  } catch {
    /* storage unavailable: the theme still applies for this session */
  }
}

// Runs before React mounts so the first render already matches the stored theme.
export function applyStoredTheme() {
  applyTheme(readTheme());
}

export function useTheme() {
  const [theme, setThemeState] = useState(readTheme);

  useEffect(() => {
    // Re-assert on mount so a route change can never leave a stale theme, and
    // adopt changes made in another tab.
    const sync = () => setThemeState(readTheme());
    applyStoredTheme();
    window.addEventListener("storage", sync);
    window.addEventListener(EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVENT, sync);
    };
  }, []);

  const setTheme = useCallback((next) => {
    applyTheme(typeof next === "function" ? next(readTheme()) : next);
    setThemeState(readTheme());
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const toggle = useCallback(
    () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    [setTheme]
  );

  return { theme, isDark: theme === "dark", setTheme, toggle };
}

export default useTheme;