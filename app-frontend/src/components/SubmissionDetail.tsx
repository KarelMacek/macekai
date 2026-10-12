import { useEffect, useState } from "react";

import { LangOverride, type Lang } from "@/contexts/LangContext";
import { ReflectionResult } from "@/features/assessments/ReflectionResult";
import { getTest } from "@/lib/api";
import type { TestDetail, TestSubmission } from "@/types/api";

import { SubmissionAnswers } from "./SubmissionAnswers";

// One submitted test, read-only (history and the reviewer's console). A
// reflection gets the same charts, grouping and comments the person saw;
// everything else is the plain answer list. `lang` is the language the test
// was taken in, so the questions read as the client saw them.
export function SubmissionDetail({ submission, lang }: { submission: TestSubmission; lang: string }) {
  const [test, setTest] = useState<TestDetail | null>(null);
  const isReflection = submission.test_type === "reflection";

  useEffect(() => {
    if (!isReflection) return;
    let cancelled = false;
    getTest(submission.test_slug, lang)
      .then((loaded) => !cancelled && setTest(loaded))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isReflection, submission.test_slug, lang]);

  if (!isReflection) return <SubmissionAnswers submission={submission} />;
  if (!test) return null;
  // The whole block (labels included) reads in the client's language.
  return (
    <LangOverride lang={(lang === "cs" ? "cs" : "en") as Lang}>
      <ReflectionResult test={test} submission={submission} readOnly />
    </LangOverride>
  );
}
