import { useState } from "react";
import { Link, useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitFeedbackRequest } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import type { JourneyStatus } from "@/types/api";

// The one "you're done with tests, here's what's next" moment — shared so it
// reads identically whether reached right after finishing the last test
// (TestPage) or on a later dashboard visit (DashboardPage), instead of two
// pages drifting into slightly different copy for the same state.
export function RequestFeedbackCta({ journey }: { journey: JourneyStatus }) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  async function send() {
    setSending(true);
    setError(false);
    try {
      await submitFeedbackRequest({});
      navigate("/feedback");
    } catch {
      setError(true);
      setSending(false);
    }
  }

  // Journeys without a CV step (SCARF): sending is one click, right here,
  // straight to the "on its way" screen - no form in between.
  if (!journey.feedback_needs_cv && !journey.feedback_request_submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("sendToCoachTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t("sendToCoachBody")}</p>
          {error && <p className="text-sm text-destructive">{t("submitError")}</p>}
          <Button onClick={send} disabled={sending} className="self-start">
            {t("sendToCoachButton")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
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
  );
}
