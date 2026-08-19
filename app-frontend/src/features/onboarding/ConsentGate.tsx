import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { submitConsent } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";

function YesNoToggle({
  value,
  onChange,
  labelledBy,
}: {
  value: boolean | null;
  onChange: (value: boolean) => void;
  labelledBy: string;
}) {
  const { t } = useTranslation();

  return (
    <div role="group" aria-labelledby={labelledBy} className="flex gap-2">
      {([true, false] as const).map((option) => {
        const active = value === option;
        return (
          <button
            key={String(option)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            style={{ borderRadius: "2px" }}
            className={`px-6 py-2 text-sm font-medium transition-colors duration-150 border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-white/15 text-muted-foreground hover:border-primary/50 hover:text-gold"
            }`}
          >
            {t(option ? "consentYes" : "consentNo")}
          </button>
        );
      })}
    </div>
  );
}

function ConsentQuestion({
  id,
  label,
  framing,
  value,
  onChange,
}: {
  id: string;
  label: string;
  framing: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 id={id} className="text-base font-semibold">
        {label}
      </h2>
      <p className="text-sm text-muted-foreground">{framing}</p>
      <YesNoToggle value={value} onChange={onChange} labelledBy={id} />
    </div>
  );
}

export function ConsentGate() {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const [aiConsent, setAiConsent] = useState<boolean | null>(null);
  const [researchConsent, setResearchConsent] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = aiConsent !== null && researchConsent !== null;

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await submitConsent({
        ai_processing_consent: aiConsent as boolean,
        research_consent: researchConsent as boolean,
      });
      await refreshUser();
    } catch {
      setError(t("submitError"));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-8 p-8">
      <div>
        <p className="section-label mb-2">{t("consentRecapTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("consentRecapBody")}</p>
        <p className="text-sm text-muted-foreground mt-2">{t("consentConfidentialityBody")}</p>
      </div>

      <ConsentQuestion
        id="consent-ai-question"
        label={t("consentAiQuestionLabel")}
        framing={t("consentAiFramingBody")}
        value={aiConsent}
        onChange={setAiConsent}
      />

      <ConsentQuestion
        id="consent-research-question"
        label={t("consentResearchQuestionLabel")}
        framing={t("consentResearchFramingBody")}
        value={researchConsent}
        onChange={setResearchConsent}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={handleSubmit} disabled={!canSubmit || submitting} className="self-start">
        {t("submitButton")}
      </Button>
    </div>
  );
}
