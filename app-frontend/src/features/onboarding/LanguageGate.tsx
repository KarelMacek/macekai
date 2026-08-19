import type { Lang } from "@/contexts/LangContext";
import { storeLang, useLang } from "@/contexts/LangContext";

// Shown once, before ConsentGate, so language is an explicit first-class
// choice rather than a small corner switcher easy to miss. Deliberately
// bilingual in its own copy (not run through useTranslation()) — we don't
// know the visitor's language yet, that's the whole point of this screen.
interface LanguageGateProps {
  /** From WhoAmI.purchased_language — pre-highlights the language the
   * account's most recent SimpleShop purchase was made under, if any. */
  suggestedLang?: string;
  onChosen: () => void;
}

export function LanguageGate({ suggestedLang, onChosen }: LanguageGateProps) {
  const { setLang } = useLang();

  function choose(lang: Lang) {
    setLang(lang);
    storeLang(lang);
    onChosen();
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-8 p-8 text-center">
      <p className="section-label">Choose your language · Zvol si jazyk</p>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => choose("en")}
          style={{ borderRadius: "2px" }}
          className={`px-8 py-4 text-base font-medium transition-colors duration-150 border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            suggestedLang === "en"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-white/15 text-muted-foreground hover:border-primary/50 hover:text-gold"
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => choose("cs")}
          style={{ borderRadius: "2px" }}
          className={`px-8 py-4 text-base font-medium transition-colors duration-150 border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            suggestedLang === "cs"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-white/15 text-muted-foreground hover:border-primary/50 hover:text-gold"
          }`}
        >
          Čeština
        </button>
      </div>
    </div>
  );
}
