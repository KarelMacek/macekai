import { useEffect, useState } from "react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getJourney } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import type { JourneyStatus } from "@/types/api";

export function DashboardPage() {
  const { t, lang } = useTranslation();
  const [journey, setJourney] = useState<JourneyStatus | null>(null);

  useEffect(() => {
    getJourney(lang).then(setJourney);
  }, [lang]);

  if (!journey) return <p className="p-8 text-sm text-muted-foreground">{t("loading")}</p>;

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
                {step.status === "upcoming" && t("stepUpcoming")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step.status !== "upcoming" && (
              <Link href={`/tests/${step.test_slug}`}>
                <Button variant={step.status === "current" ? "default" : "outline"} size="sm">
                  {step.status === "completed" ? t("reviewTest") : t("startTest")}
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
            <Link href="/feedback-request">
              <Button size="sm">{t("requestFeedbackTitle")}</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
