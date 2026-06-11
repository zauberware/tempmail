import { useCallback, useEffect, useState } from "react";

const LS_KEY = "tempmail.theme";
export type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", dark);
}

function read(): Theme {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "system";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => read());

  // re-apply when theme value changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // listen to system pref changes when in system mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(LS_KEY, next);
    } catch {
      /* ignore */
    }
    setThemeState(next);
  }, []);

  return { theme, setTheme };
}
