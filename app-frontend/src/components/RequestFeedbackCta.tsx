import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import type { JourneyStatus } from "@/types/api";

// The one "you're done with tests, here's what's next" moment — shared so it
// reads identically whether reached right after finishing the last test
// (TestPage) or on a later dashboard visit (DashboardPage), instead of two
// pages drifting into slightly different copy for the same state.
export function RequestFeedbackCta({ journey }: { journey: JourneyStatus }) {
  const { t } = useTranslation();

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
