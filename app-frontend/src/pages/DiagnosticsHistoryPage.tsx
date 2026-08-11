import { useEffect, useState } from "react";
import { useParams } from "wouter";

import { SubmissionAnswers } from "@/components/SubmissionAnswers";
import { getDiagnosticsDetail } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import type { DiagnosticsDetail } from "@/types/api";

export function DiagnosticsHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useTranslation();
  const [diagnostics, setDiagnostics] = useState<DiagnosticsDetail | null>(null);

  useEffect(() => {
    if (id) getDiagnosticsDetail(Number(id), lang).then(setDiagnostics);
  }, [id, lang]);

  if (!diagnostics) return <p className="p-8 text-sm text-muted-foreground">{t("loading")}</p>;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 p-8">
      <h1 className="text-lg font-semibold">{diagnostics.journey_slug}</h1>

      {diagnostics.submissions.map((submission) => (
        <SubmissionAnswers key={submission.id} submission={submission} />
      ))}

      {diagnostics.feedback && (
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">{t("feedbackReadyTitle")}</h2>
          {diagnostics.feedback.document_url && (
            <a
              href={diagnostics.feedback.document_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline underline-offset-4"
            >
              {t("downloadDocument")}
            </a>
          )}
          {diagnostics.feedback.video_url && (
            <a
              href={diagnostics.feedback.video_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline underline-offset-4"
            >
              {t("watchVideo")}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
