"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Icon from "./Icon";
import { startTranslator, stopTranslator } from "@/src/i18n/translator";

export type Lang = "id" | "en";
export type Theme = "light" | "dark";

type Prefs = {
  lang: Lang;
  theme: Theme;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
};

const PrefsContext = createContext<Prefs | null>(null);

export function usePreferences() {
  const value = useContext(PrefsContext);
  if (!value) throw new Error("usePreferences harus di dalam <PreferencesProvider>");
  return value;
}

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* mode privat: preferensi hanya berlaku di sesi ini */
  }
  // Cookie agar server tahu bahasa (mis. untuk chatbot).
  document.cookie = `${key}=${value}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Preferensi tampilan: bahasa (ID/EN) dan tema (terang/gelap).
 * Nilai awal dipasang lebih dulu oleh skrip kecil di <head> (layout.tsx)
 * supaya tidak berkedip.
 */
export default function PreferencesProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    setLangState(read("ckin_lang") === "en" ? "en" : "id");
    setThemeState(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    if (lang === "en") startTranslator();
    else {
      stopTranslator();
      document.documentElement.classList.remove("i18n-pending");
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    write("ckin_lang", next);
    setLangState(next);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    write("ckin_theme", next);
    document.documentElement.dataset.theme = next;
    setThemeState(next);
  }, []);

  const value = useMemo(() => ({ lang, theme, setLang, setTheme }), [lang, theme, setLang, setTheme]);
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

/** Tombol ganti bahasa ID ⇄ EN. */
export function LangToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = usePreferences();
  return (
    <div className="seg" role="group" aria-label="Bahasa" data-no-translate>
      {(["id", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          className={lang === l ? "on" : ""}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          title={l === "id" ? "Bahasa Indonesia" : "English"}
        >
          {compact ? l.toUpperCase() : l === "id" ? "ID" : "EN"}
        </button>
      ))}
    </div>
  );
}

/** Tombol tema terang/gelap. */
export function ThemeToggle() {
  const { theme, setTheme } = usePreferences();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Mode terang" : "Mode gelap"}
      title={dark ? "Mode terang" : "Mode gelap"}
    >
      <Icon name={dark ? "sun" : "moon"} size={18} />
    </button>
  );
}
