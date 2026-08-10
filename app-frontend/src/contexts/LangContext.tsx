import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "cs";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
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
  const [lang, setLang] = useState<Lang>(detectDefaultLang);
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
