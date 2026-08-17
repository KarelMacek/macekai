import { storeLang, useLang } from "@/contexts/LangContext";

export function LangSwitcher() {
  const { lang, setLang } = useLang();

  function choose(l: "en" | "cs") {
    setLang(l);
    storeLang(l);
  }

  return (
    <div className="section-label flex gap-1">
      <button
        type="button"
        onClick={() => choose("en")}
        className={lang === "en" ? "text-gold" : "text-muted-foreground"}
      >
        EN
      </button>
      <span className="text-muted-foreground">/</span>
      <button
        type="button"
        onClick={() => choose("cs")}
        className={lang === "cs" ? "text-gold" : "text-muted-foreground"}
      >
        CS
      </button>
    </div>
  );
}
