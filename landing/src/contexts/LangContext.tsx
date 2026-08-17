import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "cs" | "en";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
}

// Mirrors app-frontend's own detectDefaultLang() (app-frontend/src/contexts/
// LangContext.tsx) — same browser-locale heuristic, kept in sync so both
// apps behave consistently now that neither has a manual switcher on
// landing. Fallback is "cs" (not app-frontend's "en") to match this site's
// CZ-primary audience.
function detectDefaultLang(): Lang {
  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("en")) {
    return "en";
  }
  return "cs";
}

const LangContext = createContext<LangContextType>({
  lang: "cs",
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(detectDefaultLang);
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
