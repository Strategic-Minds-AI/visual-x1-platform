import { useEffect, useState } from "react";

const KEY = "visualx-theme";
const read = () => {
  try {
    return localStorage.getItem(KEY) || "dark";
  } catch {
    return "dark";
  }
};

// Runs before React mounts so the first paint is already the stored theme.
export function applyStoredTheme() {
  document.documentElement.classList.toggle("dark", read() === "dark");
}

export default function useTheme() {
  const [theme, setTheme] = useState(read);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* storage unavailable: the theme still applies for this session */
    }
  }, [theme]);

  return {
    theme,
    isDark: theme === "dark",
    toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark"))
  };
}