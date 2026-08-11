import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";

import { SubmissionAnswers } from "@/components/SubmissionAnswers";
import { Button } from "@/components/ui/button";
import { MappingTest } from "@/features/assessments/MappingTest";
import { SnapshotResult } from "@/features/assessments/SnapshotResult";
import { SnapshotTest } from "@/features/assessments/SnapshotTest";
import { getSubmissions, getTest } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import type { TestDetail, TestSubmission } from "@/types/api";

export function TestPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useTranslation();
  const [test, setTest] = useState<TestDetail | null>(null);
  // The most recent submission already on file for this test, if any — kept
  // separate from `submission` (the just-now result screen) so "Review"
  // shows what was actually answered instead of dumping the customer back
  // into a blank form. undefined = still loading, null = none exists.
  const [existingSubmission, setExistingSubmission] = useState<TestSubmission | null | undefined>(undefined);
  const [submission, setSubmission] = useState<TestSubmission | null>(null);
  const [retaking, setRetaking] = useState(false);

  useEffect(() => {
    setTest(null);
    setSubmission(null);
    setExistingSubmission(undefined);
    setRetaking(false);
    if (!slug) return;
    getTest(slug, lang).then(setTest);
    getSubmissions().then((subs) => setExistingSubmission(subs.find((s) => s.test_slug === slug) ?? null));
  }, [slug, lang]);

  if (!test || existingSubmission === undefined) return <p className="p-8 text-sm text-muted-foreground">{t("loading")}</p>;

  if (submission) {
    return (
      <div className="p-8">
        {test.test_type === "snapshot" ? (
          <SnapshotResult categories={test.categories} submission={submission} />
        ) : (
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">{t("feedbackRequestSubmitted")}</p>
        )}
        <div className="mx-auto mt-8 w-full max-w-xl">
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
        <SubmissionAnswers submission={existingSubmission} />
        <div className="flex gap-3">
          <Link href="/">
            <Button variant="outline" size="sm">
              {t("continueButton")}
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setRetaking(true)}>
            {t("fillAgain")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="mx-auto mb-2 w-full max-w-xl text-xl font-semibold">{test.title}</h1>
      {test.description && (
        <p className="mx-auto mb-8 w-full max-w-xl text-sm text-muted-foreground">{test.description}</p>
      )}
      {test.test_type === "snapshot" ? (
        <SnapshotTest test={test} onComplete={setSubmission} />
      ) : (
        <MappingTest test={test} onComplete={setSubmission} />
      )}
    </div>
  );
}
