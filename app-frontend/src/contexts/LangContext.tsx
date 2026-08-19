import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "cs";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
}

// Written once per diagnostics by LanguageGate (the onboarding "pick your
// language" screen), the only place allowed to write it. Scoped to a
// diagnostics id (WhoAmI.current_diagnostics_id), not just the browser —
// a browser that already answered for an older diagnostics must still be
// asked again for a new one (re-purchase, admin re-grant in a different
// language), rather than a stale choice silently winning. Once answered for
// a given diagnostics it's locked for that diagnostics: no switcher, no
// auto-correction from purchase records (see git history for what NOT to
// reintroduce).
const LANG_CHOSEN_KEY = "macekai-lang-chosen";

interface StoredLangChoice {
  diagnosticsId: number | null;
  lang: Lang;
}

function readStoredChoice(): StoredLangChoice | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(LANG_CHOSEN_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      ((parsed as StoredLangChoice).lang === "en" || (parsed as StoredLangChoice).lang === "cs") &&
      (typeof (parsed as StoredLangChoice).diagnosticsId === "number" ||
        (parsed as StoredLangChoice).diagnosticsId === null)
    ) {
      return parsed as StoredLangChoice;
    }
  } catch {
    // Malformed or pre-scoping legacy value (a bare "en"/"cs" string) —
    // treat as unanswered rather than guessing which diagnostics it meant.
  }
  return null;
}

/** Best-guess initial value before the current diagnostics id is known
 * (LangProvider mounts above AuthProvider, ahead of the whoami fetch). Only
 * ever used as a first-paint placeholder — `getStoredLangFor` below is what
 * actually decides whether LanguageGate should show. */
export function getStoredLangRaw(): Lang | null {
  return readStoredChoice()?.lang ?? null;
}

export function getStoredLangFor(diagnosticsId: number | null): Lang | null {
  const stored = readStoredChoice();
  return stored && stored.diagnosticsId === diagnosticsId ? stored.lang : null;
}

export function storeLang(lang: Lang, diagnosticsId: number | null): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(LANG_CHOSEN_KEY, JSON.stringify({ diagnosticsId, lang }));
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
  const [lang, setLang] = useState<Lang>(() => getStoredLangRaw() ?? detectDefaultLang());
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
