import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLang, type Lang } from "@/contexts/LangContext";
import { getDiagnosticsList, getJourney } from "@/lib/api";
import { useTranslation, type TranslationKey } from "@/lib/i18n";
import type { DiagnosticsSummary, DiagnosticsStatus, JourneyStatus } from "@/types/api";

const SUPPORTED_LANGS: Lang[] = ["en", "cs"];

export const STATUS_LABEL_KEY: Record<DiagnosticsStatus, TranslationKey> = {
  tests_in_progress: "diagnosticsStatusTestsInProgress",
  awaiting_feedback_request: "diagnosticsStatusAwaitingFeedbackRequest",
  awaiting_admin_review: "diagnosticsStatusAwaitingAdminReview",
  completed: "diagnosticsStatusCompleted",
};

export function DashboardPage() {
  const { t, lang } = useTranslation();
  const { setLang } = useLang();
  const [journey, setJourney] = useState<JourneyStatus | null>(null);
  const [diagnosticsList, setDiagnosticsList] = useState<DiagnosticsSummary[] | null>(null);
  const correctedLangFromPurchase = useRef(false);

  useEffect(() => {
    getJourney(lang).then(setJourney);
    getDiagnosticsList().then((list) => {
      setDiagnosticsList(list);
      // One-time nudge: default to the language actually purchased instead
      // of only the browser-guessed one, without fighting a later manual
      // switch (see SUPPORTED_LANGS guard — language may be "" for
      // admin-opened diagnostics).
      const purchasedLang = list[0]?.language;
      if (!correctedLangFromPurchase.current && SUPPORTED_LANGS.includes(purchasedLang as Lang)) {
        correctedLangFromPurchase.current = true;
        if (purchasedLang !== lang) setLang(purchasedLang as Lang);
      }
    });
  }, [lang, setLang]);

  if (!journey) return <p className="p-8 text-sm text-muted-foreground">{t("loading")}</p>;

  const currentDiagnosticsId = journey.diagnostics_id;
  const pastDiagnostics = (diagnosticsList ?? []).filter((d) => d.id !== currentDiagnosticsId);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-8">
      <h1 className="text-xl font-semibold">{t("journeyTitle")}</h1>

      {journey.steps.map((step) => (
        <Card key={step.order}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>{step.title}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {step.status === "completed" && t("stepCompleted")}
                {step.status === "current" && t("stepCurrent")}
                {step.status === "in_progress" && t("stepInProgress")}
                {step.status === "upcoming" && t("stepUpcoming")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step.status !== "upcoming" && (
              <Link href={`/tests/${step.test_slug}`}>
                <Button
                  variant={step.status === "current" || step.status === "in_progress" ? "default" : "outline"}
                  size="sm"
                >
                  {step.status === "completed"
                    ? t("reviewTest")
                    : step.status === "in_progress"
                      ? t("continueButton")
                      : t("startTest")}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ))}

      {journey.all_tests_done && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("allDone")}</CardTitle>
          </CardHeader>
          <CardContent>
            {journey.feedback_request_submitted ? (
              <Link href="/feedback">
                <Button>{t("viewFeedback")}</Button>
              </Link>
            ) : (
              <Link href="/feedback-request">
                <Button>{t("requestFeedbackTitle")}</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {pastDiagnostics.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          <h2 className="section-label">{t("pastDiagnosticsTitle")}</h2>
          {pastDiagnostics.map((d) => (
            <Card key={d.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>{new Date(d.opened_at).toLocaleDateString()}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {t(STATUS_LABEL_KEY[d.status])}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/diagnostics/${d.id}`}>
                  <Button variant="outline" size="sm">
                    {t("viewDiagnostics")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
