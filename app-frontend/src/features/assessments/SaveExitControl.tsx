import { Link } from "wouter";

import { useTranslation } from "@/lib/i18n";

export type AutosaveState = "idle" | "saving" | "saved";

interface Props {
  autosaveState: AutosaveState;
}

// Two layers that solve different problems, both required: autosave itself
// (invisible, automatic) is the technical guarantee nothing is lost; this
// visible "Save & finish later" control is the psychological permission —
// it tells an anxious user mid-test that stopping right now is genuinely
// fine. The ephemeral "Saving…"/"Saved" text next to it is the proof that
// autosave is actually working, not just claimed.
export function SaveExitControl({ autosaveState }: Props) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 flex items-center justify-between text-xs">
      <Link href="/" className="text-muted-foreground underline-offset-2 hover:text-gold hover:underline">
        {t("saveAndExit")}
      </Link>
      <span
        className="text-muted-foreground transition-opacity duration-300"
        style={{ opacity: autosaveState === "idle" ? 0 : 1 }}
        aria-live="polite"
      >
        {autosaveState === "saving" ? t("savingIndicator") : autosaveState === "saved" ? t("savedIndicator") : ""}
      </span>
    </div>
  );
}
