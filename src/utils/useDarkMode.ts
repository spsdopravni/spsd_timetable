import { useEffect, useState } from "react";

const STORAGE_KEY = "dark_mode_pref";

type Pref = "light" | "dark" | "auto";

function getSystemDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readPref(): Pref {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "auto") return v;
  } catch {}
  return "auto";
}

function applyClass(isDark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", isDark);
  // Tell the browser about the active scheme so native scrollbars / form
  // controls also follow.
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

export function useDarkMode() {
  const [pref, setPrefState] = useState<Pref>(() => readPref());
  const [systemDark, setSystemDark] = useState<boolean>(() => getSystemDark());

  // Reflect changes to system pref while pref === "auto".
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isDark = pref === "auto" ? systemDark : pref === "dark";

  useEffect(() => {
    applyClass(isDark);
  }, [isDark]);

  const setPref = (p: Pref) => {
    try { localStorage.setItem(STORAGE_KEY, p); } catch {}
    setPrefState(p);
  };

  return { pref, isDark, setPref };
}

// Apply on initial load (before React mounts) — prevents light-flash.
if (typeof window !== "undefined") {
  const p = readPref();
  const isDark = p === "dark" || (p === "auto" && getSystemDark());
  applyClass(isDark);
}
