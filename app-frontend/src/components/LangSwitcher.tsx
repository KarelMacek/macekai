import { useLang } from "@/contexts/LangContext";

export function LangSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div className="section-label flex gap-1">
      <button
        type="button"
        onClick={() => setLang("en")}
        className={lang === "en" ? "text-gold" : "text-muted-foreground"}
      >
        EN
      </button>
      <span className="text-muted-foreground">/</span>
      <button
        type="button"
        onClick={() => setLang("cs")}
        className={lang === "cs" ? "text-gold" : "text-muted-foreground"}
      >
        CS
      </button>
    </div>
  );
}
