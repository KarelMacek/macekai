import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "cs";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
}

// Written by LanguageGate (the onboarding "pick your language" screen) and
// LangSwitcher (the small header/ConsentGate toggle) alike, so a choice made
// either way sticks across sessions instead of re-guessing from the browser
// every time.
const LANG_CHOSEN_KEY = "macekai-lang-chosen";

export function getStoredLang(): Lang | null {
  if (typeof localStorage === "undefined") return null;
  const stored = localStorage.getItem(LANG_CHOSEN_KEY);
  return stored === "en" || stored === "cs" ? stored : null;
}

export function storeLang(lang: Lang): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(LANG_CHOSEN_KEY, lang);
}

function detectDefaultLang(): Lang {
  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("cs")) {
    return "cs";
  }
  return "en";
}

const LangContext = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => getStoredLang() ?? detectDefaultLang());
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
