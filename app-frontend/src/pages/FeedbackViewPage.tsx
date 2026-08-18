import { useEffect, useState } from "react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { getFeedback, getJourney } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import type { AdminFeedback } from "@/types/api";

export function FeedbackViewPage() {
  const { t, lang } = useTranslation();
  const [feedback, setFeedback] = useState<AdminFeedback | null | undefined>(undefined);
  const [diagnosticsId, setDiagnosticsId] = useState<number | null>(null);

  useEffect(() => {
    getFeedback().then(setFeedback);
    getJourney(lang).then((journey) => setDiagnosticsId(journey.diagnostics_id));
  }, [lang]);

  if (feedback === undefined) return <p className="p-8 text-sm text-muted-foreground">{t("loading")}</p>;

  if (feedback === null) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-2 p-8">
        <h1 className="text-lg font-semibold">{t("feedbackPendingTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("feedbackPendingBody")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-8">
      <h1 className="text-lg font-semibold">{t("feedbackReadyTitle")}</h1>
      {feedback.notes && <p className="text-sm text-muted-foreground">{feedback.notes}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        {feedback.document_url && (
          <a href={feedback.document_url} target="_blank" rel="noreferrer">
            <Button size="sm">{t("downloadDocument")}</Button>
          </a>
        )}
        {feedback.video_url && (
          <a href={feedback.video_url} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline">
              {t("watchVideo")}
            </Button>
          </a>
        )}
        {diagnosticsId !== null && (
          <Link href={`/diagnostics/${diagnosticsId}`}>
            <Button size="sm" variant="outline">
              {t("viewMyAnswers")}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
