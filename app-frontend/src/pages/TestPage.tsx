import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";

import { SubmissionAnswers } from "@/components/SubmissionAnswers";
import { Button } from "@/components/ui/button";
import { MappingTest } from "@/features/assessments/MappingTest";
import { SnapshotResult } from "@/features/assessments/SnapshotResult";
import { SnapshotTest } from "@/features/assessments/SnapshotTest";
import { getJourney, getSubmissions, getTest } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import type { JourneyStatus, TestDetail, TestSubmission } from "@/types/api";

// Counts answers that differ from the pre-edit submission, so the post-edit
// confirmation can say "you changed 3 answers" instead of a generic "saved".
function countChangedAnswers(before: TestSubmission, after: TestSubmission): number {
  const beforeByQuestion = new Map(before.answers.map((a) => [a.question_id, a]));
  let changed = 0;
  for (const answer of after.answers) {
    const prior = beforeByQuestion.get(answer.question_id);
    if (
      !prior ||
      prior.selected_option_id !== answer.selected_option_id ||
      prior.text_value !== answer.text_value
    ) {
      changed += 1;
    }
  }
  return changed;
}

export function TestPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useTranslation();
  const [test, setTest] = useState<TestDetail | null>(null);
  // The most recent *submitted* attempt on file for this test, if any — kept
  // separate from `submission` (the just-now result screen) so "Review"
  // shows what was actually answered instead of dumping the customer back
  // into a blank form. undefined = still loading, null = none exists.
  const [existingSubmission, setExistingSubmission] = useState<TestSubmission | null | undefined>(undefined);
  const [submission, setSubmission] = useState<TestSubmission | null>(null);
  const [retaking, setRetaking] = useState(false);
  const [journey, setJourney] = useState<JourneyStatus | null>(null);

  useEffect(() => {
    setTest(null);
    setSubmission(null);
    setExistingSubmission(undefined);
    setRetaking(false);
    setJourney(null);
    if (!slug) return;
    getTest(slug, lang).then(setTest);
    getSubmissions().then((subs) => setExistingSubmission(subs.find((s) => s.test_slug === slug) ?? null));
  }, [slug, lang]);

  if (!test || existingSubmission === undefined) return <p className="p-8 text-sm text-muted-foreground">{t("loading")}</p>;

  const wasEditing = retaking && existingSubmission !== null;

  if (submission) {
    const changedCount =
      wasEditing && existingSubmission ? countChangedAnswers(existingSubmission, submission) : null;
    const nextStep = journey?.steps.find((s) => s.status === "current" || s.status === "in_progress");

    return (
      <div className="p-8">
        {changedCount !== null && (
          <p className="mx-auto mb-6 w-full max-w-xl text-sm text-muted-foreground">
            {changedCount > 0 ? t("editSummary", { count: changedCount }) : t("editSummaryNone")}
          </p>
        )}
        {test.test_type === "snapshot" ? (
          <SnapshotResult categories={test.categories} submission={submission} />
        ) : (
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">{t("feedbackRequestSubmitted")}</p>
        )}
        <div className="mx-auto mt-8 flex w-full max-w-xl flex-col gap-4">
          {/* Naming the next step directly (instead of a bare "Continue")
              is the "what's next" touchpoint — closing the loop on "will I
              ever feel lost" right at the moment a step just finished. */}
          {!wasEditing && nextStep && (
            <div className="border-t pt-4">
              <p className="mb-1 text-sm font-medium">{t("whatsNextHeading")}</p>
              <p className="mb-1 text-sm text-muted-foreground">
                {t("whatsNextBody", { step: nextStep.title })}
              </p>
              <p className="mb-4 text-xs text-muted-foreground">{t("whatsNextLater")}</p>
              <Link href={`/tests/${nextStep.test_slug}`}>
                <Button size="sm">{t("startTest")}</Button>
              </Link>
            </div>
          )}
          <Link href="/">
            <Button variant="outline" size="sm">
              {t("continueButton")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (existingSubmission && !retaking) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-8">
        <h1 className="text-xl font-semibold">{test.title}</h1>
        {test.test_type === "snapshot" ? (
          <SnapshotResult categories={test.categories} submission={existingSubmission} />
        ) : (
          <SubmissionAnswers submission={existingSubmission} />
        )}
        <div className="flex gap-3">
          <Link href="/">
            <Button variant="outline" size="sm">
              {t("continueButton")}
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setRetaking(true)}>
            {t("editAnswers")}
          </Button>
        </div>
      </div>
    );
  }

  function handleComplete(result: TestSubmission) {
    getJourney(lang).then(setJourney);
    setSubmission(result);
  }

  return (
    <div className="p-8">
      {test.test_type === "snapshot" ? (
        <SnapshotTest test={test} onComplete={handleComplete} isEditing={wasEditing} />
      ) : (
        <MappingTest test={test} onComplete={handleComplete} isEditing={wasEditing} />
      )}
    </div>
  );
}
