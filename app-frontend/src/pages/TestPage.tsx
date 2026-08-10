import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";

import { Button } from "@/components/ui/button";
import { MappingTest } from "@/features/assessments/MappingTest";
import { SnapshotResult } from "@/features/assessments/SnapshotResult";
import { SnapshotTest } from "@/features/assessments/SnapshotTest";
import { getTest } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import type { TestDetail, TestSubmission } from "@/types/api";

export function TestPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useTranslation();
  const [test, setTest] = useState<TestDetail | null>(null);
  const [submission, setSubmission] = useState<TestSubmission | null>(null);

  useEffect(() => {
    setTest(null);
    setSubmission(null);
    if (slug) getTest(slug, lang).then(setTest);
  }, [slug, lang]);

  if (!test) return <p className="p-8 text-sm text-muted-foreground">{t("loading")}</p>;

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
