import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n";
import { submitTest } from "@/lib/api";
import type { AnswerInput, TestDetail, TestSubmission } from "@/types/api";

// Adapted from landing/src/components/QuickReflectionModal.tsx's
// question/calculating/result phase machine and auto-advance timing, but
// driven by admin-authored questions/options from the API instead of a
// hardcoded array, and scored server-side (compute_result is authoritative)
// instead of locally.
const ANSWER_ADVANCE_DELAY_MS = 200;
const CALCULATING_DELAY_MS = 400;

type Phase = "question" | "calculating" | "result";

interface Props {
  test: TestDetail;
  onComplete: (submission: TestSubmission) => void;
}

export function SnapshotTest({ test, onComplete }: Props) {
  const { t } = useTranslation();
  const headingId = useId();
  const questions = test.questions;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerInput>>({});
  const [phase, setPhase] = useState<Phase>("question");
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const question = questions[currentIndex];
  const currentAnswer = answers[question.id];

  function handleSelect(optionId: number) {
    if (timerRef.current) clearTimeout(timerRef.current);
    const nextAnswers = {
      ...answers,
      [question.id]: { ...answers[question.id], question_id: question.id, option_id: optionId },
    };
    setAnswers(nextAnswers);

    timerRef.current = setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        finish(nextAnswers);
      }
    }, ANSWER_ADVANCE_DELAY_MS);
  }

  function handleComment(value: string) {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { ...prev[question.id], question_id: question.id, comment: value },
    }));
  }

  function handleBack() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentIndex((i) => Math.max(0, i - 1));
  }

  async function finish(finalAnswers: Record<number, AnswerInput>) {
    setPhase("calculating");
    timerRef.current = setTimeout(async () => {
      try {
        const submission = await submitTest(test.slug, Object.values(finalAnswers));
        setPhase("result");
        onComplete(submission);
      } catch {
        setError(t("submitError"));
        setPhase("question");
      }
    }, CALCULATING_DELAY_MS);
  }

  if (phase === "calculating") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <p className="text-sm text-muted-foreground">{t("calculating")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("questionProgress", { current: currentIndex + 1, total: questions.length })}</span>
      </div>
      <Progress value={((currentIndex + 1) / questions.length) * 100} className="mb-8" />

      <h2 id={headingId} className="mb-6 text-xl font-semibold">
        {question.text}
      </h2>
      {question.help_text && <p className="mb-4 text-sm text-muted-foreground">{question.help_text}</p>}

      <div role="group" aria-labelledby={headingId} className="mb-6 grid gap-2" style={{ gridTemplateColumns: `repeat(${question.options.length}, minmax(0, 1fr))` }}>
        {question.options.map((option) => {
          const active = currentAnswer?.option_id === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => handleSelect(option.id)}
              className={`flex flex-col items-center justify-center gap-1 rounded-md border px-2 py-3 text-center text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {question.allow_comment && (
        <Textarea
          value={currentAnswer?.comment ?? ""}
          onChange={(e) => handleComment(e.target.value)}
          placeholder=""
          className="mb-6"
        />
      )}

      <div className="h-5">
        {currentIndex > 0 && (
          <button type="button" onClick={handleBack} className="text-xs text-muted-foreground hover:text-foreground">
            ← {t("backButton")}
          </button>
        )}
      </div>
    </div>
  );
}
