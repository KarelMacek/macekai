import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "cs";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
}

// No client-side persistence and no manual switcher: once a user is signed
// in with diagnostics, AppShell (App.tsx) forces `lang` to follow
// WhoAmI.purchased_language deterministically on every load — the language
// the diagnostics was actually purchased/granted under. Before that (signed
// out, still loading) this is just a browser-locale guess for chrome text
// we have no better signal for yet. See git history for the localStorage-
// based "ask once, remember forever" scheme this replaced — it went stale
// across a delete + re-grant because the browser had no idea which
// diagnostics its stored choice was ever answered for.
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
