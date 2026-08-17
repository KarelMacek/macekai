import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getDraft, patchDraft, submitTest } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import type { AnswerInput, TestDetail, TestSubmission } from "@/types/api";

import { AmbientMilestoneBanner } from "./AmbientMilestoneBanner";
import { ResumeBanner } from "./ResumeBanner";
import { SaveExitControl, type AutosaveState } from "./SaveExitControl";
import { TestIntroScreen } from "./TestIntroScreen";

type Phase = "loading" | "intro" | "question" | "review";

interface Props {
  test: TestDetail;
  onComplete: (submission: TestSubmission) => void;
  isEditing?: boolean;
}

// A hybrid, not a straight "one page" -> "one question per screen" swap:
// writing happens step-by-step (a wall of 20 blank textareas at once is the
// most overwhelming screen in either test), but the original single-page
// design's real value — reviewing everything before committing — is kept
// via a dedicated review step plus this always-visible outline, rather than
// thrown away.
export function MappingTest({ test, onComplete, isEditing = false }: Props) {
  const { t } = useTranslation();
  const questions = test.questions;

  const [phase, setPhase] = useState<Phase>("loading");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [values, setValues] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [ambientMessage, setAmbientMessage] = useState<string | null>(null);

  const seenMilestonesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    getDraft(test.slug).then((draft) => {
      if (cancelled) return;
      const loaded: Record<number, string> = {};
      for (const answer of draft.answers) loaded[answer.question_id] = answer.text_value;
      setValues(loaded);

      const firstUnansweredIndex = questions.findIndex((q) => !loaded[q.id]?.trim());
      const hasAnyAnswers = draft.answers.length > 0;
      const isPartial = hasAnyAnswers && firstUnansweredIndex !== -1;

      setCurrentIndex(firstUnansweredIndex === -1 ? 0 : firstUnansweredIndex);
      setShowResumeBanner(isPartial && !isEditing);
      setPhase(hasAnyAnswers ? "question" : "intro");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test.slug]);

  const question = questions[currentIndex];
  const answeredCount = questions.filter((q) => values[q.id]?.trim()).length;
  const allAnswered = answeredCount === questions.length;

  function saveAnswer(questionId: number, value: string) {
    if (!value.trim()) return;
    setAutosaveState("saving");
    patchDraft(test.slug, [{ question_id: questionId, text_value: value }])
      .then(() => setAutosaveState("saved"))
      .catch(() => setAutosaveState("idle"));
  }

  function handleChange(value: string) {
    setValues((prev) => ({ ...prev, [question.id]: value }));
  }

  function goTo(index: number) {
    saveAnswer(question.id, values[question.id] ?? "");
    setCurrentIndex(index);
  }

  function handleNext() {
    saveAnswer(question.id, values[question.id] ?? "");

    const newlyAnsweredCount = questions.filter((q) => values[q.id]?.trim()).length;
    if (!isEditing && newlyAnsweredCount % 5 === 0 && !seenMilestonesRef.current.has(newlyAnsweredCount)) {
      seenMilestonesRef.current.add(newlyAnsweredCount);
      setAmbientMessage(
        t("mappingAmbientProgress", { current: newlyAnsweredCount, remaining: questions.length - newlyAnsweredCount })
      );
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setPhase("review");
    }
  }

  function handleBack() {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }

  async function handleSubmit() {
    const answers: AnswerInput[] = questions.map((q) => ({
      question_id: q.id,
      text_value: values[q.id] ?? "",
    }));

    setSubmitting(true);
    setError(null);
    try {
      const submission = await submitTest(test.slug, answers);
      onComplete(submission);
    } catch {
      setError(t("submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "loading") {
    return <p className="p-8 text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (phase === "intro") {
    return (
      <TestIntroScreen
        testType="mapping"
        title={test.title}
        description={test.description}
        instructions={test.instructions}
        onStart={() => setPhase("question")}
      />
    );
  }

  if (phase === "review") {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <SaveExitControl autosaveState={autosaveState} />
        <div>
          <h2 className="mb-1 text-lg font-semibold">{t("reviewAllTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("reviewAllIntro")}</p>
        </div>

        {questions.map((q) => (
          <div key={q.id} className="flex flex-col gap-2">
            <Label htmlFor={`review-q-${q.id}`}>{q.text}</Label>
            <Textarea
              id={`review-q-${q.id}`}
              value={values[q.id] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [q.id]: e.target.value }))}
              onBlur={(e) => saveAnswer(q.id, e.target.value)}
            />
          </div>
        ))}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleSubmit} disabled={submitting || !allAnswered}>
          {isEditing ? t("saveChanges") : t("submitButton")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <SaveExitControl autosaveState={autosaveState} />
      {showResumeBanner && <ResumeBanner current={currentIndex + 1} total={questions.length} />}
      {ambientMessage && (
        <AmbientMilestoneBanner message={ambientMessage} onDone={() => setAmbientMessage(null)} />
      )}

      <div className="section-label mb-4">
        {t("questionProgress", { current: currentIndex + 1, total: questions.length })}
      </div>

      {/* Compact outline: every question at a glance, answered ones marked,
          any one tappable — this is what keeps "review earlier answers"
          possible without going back to a single all-at-once page. */}
      <div className="mb-6 flex flex-wrap gap-1.5" role="list">
        {questions.map((q, i) => {
          const answered = Boolean(values[q.id]?.trim());
          const active = i === currentIndex;
          return (
            <button
              key={q.id}
              type="button"
              role="listitem"
              aria-label={t("outlineJumpAriaLabel", { n: i + 1 })}
              aria-current={active}
              onClick={() => goTo(i)}
              style={{ borderRadius: "2px" }}
              className={`flex h-7 w-7 items-center justify-center border text-[0.65rem] font-medium transition-colors duration-150 ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : answered
                    ? "border-primary/40 text-primary"
                    : "border-white/15 text-muted-foreground hover:border-primary/50"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`q-${question.id}`}>{question.text}</Label>
        {question.help_text && <p className="text-sm text-muted-foreground">{question.help_text}</p>}
        <Textarea
          id={`q-${question.id}`}
          value={values[question.id] ?? ""}
          onChange={(e) => handleChange(e.target.value)}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">{t("mappingBrevityHint")}</p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div>
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="text-xs text-muted-foreground transition-colors duration-150 hover:text-gold"
            >
              ← {t("backButton")}
            </button>
          )}
        </div>
        <Button onClick={handleNext}>
          {currentIndex === questions.length - 1 ? t("reviewAllTitle") : t("nextButton")}
        </Button>
      </div>
    </div>
  );
}
