import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n";
import { getDraft, patchDraft, submitTest } from "@/lib/api";
import type { AnswerInput, TestDetail, TestSubmission } from "@/types/api";

import { AmbientMilestoneBanner } from "./AmbientMilestoneBanner";
import { CategoryBadge } from "./CategoryBadge";
import { MilestoneInterstitial } from "./MilestoneInterstitial";
import { ResumeBanner } from "./ResumeBanner";
import { SaveExitControl, type AutosaveState } from "./SaveExitControl";
import { TestIntroScreen } from "./TestIntroScreen";

// Adapted from landing/src/components/QuickReflectionModal.tsx's
// question/calculating/result phase machine and auto-advance timing, but
// driven by admin-authored questions/options from the API instead of a
// hardcoded array, and scored server-side (compute_result is authoritative)
// instead of locally.
//
// 350ms (up from an earlier 200ms) plus a brief post-transition input lock
// is a deliberate anti-rapid-clicking choice: long enough that a tap reads
// as registered rather than swallowed, and the lock closes a real
// interaction bug — a fast double-tap during auto-advance could otherwise
// land on the *next* question's option in the same screen position before
// it's even been read.
const ANSWER_ADVANCE_DELAY_MS = 350;
const INPUT_LOCK_MS = 200;
const CALCULATING_DELAY_MS = 400;

type Phase = "loading" | "intro" | "question" | "milestone" | "calculating" | "result";

interface Props {
  test: TestDetail;
  onComplete: (submission: TestSubmission) => void;
  isEditing?: boolean;
}

function fractionIndex(total: number, fraction: number): number {
  return Math.round(total * fraction) - 1;
}

export function SnapshotTest({ test, onComplete, isEditing = false }: Props) {
  const { t } = useTranslation();
  const headingId = useId();
  const questions = test.questions;

  const categoryNameByKey = useMemo(() => {
    const map: Record<string, string> = {};
    for (const category of test.categories) map[category.key] = category.name;
    return map;
  }, [test.categories]);

  const [phase, setPhase] = useState<Phase>("loading");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerInput>>({});
  const [error, setError] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<Set<number>>(new Set());
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [ambientMessage, setAmbientMessage] = useState<string | null>(null);
  const [inputLocked, setInputLocked] = useState(false);
  const [pendingMilestoneMessage, setPendingMilestoneMessage] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenMilestonesRef = useRef<Set<number>>(new Set());

  const thirtyPercentIndex = fractionIndex(questions.length, 0.3);
  const sixtyPercentIndex = fractionIndex(questions.length, 0.6);
  const ninetyPercentIndex = fractionIndex(questions.length, 0.9);

  // Load (or lazily create/seed) the draft once on mount — the same
  // primitive whether this is a first-ever visit (empty), a resumed
  // in-progress attempt (partially answered), or an edit of a submitted
  // test (fully pre-filled from the prior submission).
  useEffect(() => {
    let cancelled = false;
    getDraft(test.slug).then((draft) => {
      if (cancelled) return;
      const loaded: Record<number, AnswerInput> = {};
      for (const answer of draft.answers) {
        loaded[answer.question_id] = {
          question_id: answer.question_id,
          option_id: answer.selected_option_id ?? undefined,
          comment: answer.comment,
        };
      }
      setAnswers(loaded);

      const firstUnansweredIndex = questions.findIndex((q) => !(q.id in loaded));
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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, []);

  const question = questions[currentIndex];
  const currentAnswer = question ? answers[question.id] : undefined;

  function autosave(nextAnswers: Record<number, AnswerInput>, questionId: number) {
    setAutosaveState("saving");
    patchDraft(test.slug, [nextAnswers[questionId]])
      .then(() => setAutosaveState("saved"))
      .catch(() => setAutosaveState("idle"));
  }

  function lockInputBriefly() {
    setInputLocked(true);
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(() => setInputLocked(false), INPUT_LOCK_MS);
  }

  function advanceOrFinish(nextAnswers: Record<number, AnswerInput>, fromIndex: number) {
    if (!isEditing && !seenMilestonesRef.current.has(fromIndex)) {
      if (fromIndex === thirtyPercentIndex) {
        seenMilestonesRef.current.add(fromIndex);
        setPendingMilestoneMessage(t("milestoneThirdDone"));
        setPhase("milestone");
        return;
      }
      if (fromIndex === sixtyPercentIndex) {
        seenMilestonesRef.current.add(fromIndex);
        setAmbientMessage(t("milestonePastHalfway"));
      } else if (fromIndex === ninetyPercentIndex) {
        seenMilestonesRef.current.add(fromIndex);
        setAmbientMessage(t("milestoneAlmostThere"));
      }
    }

    if (fromIndex < questions.length - 1) {
      setCurrentIndex(fromIndex + 1);
      lockInputBriefly();
    } else {
      finish(nextAnswers);
    }
  }

  function handleSelect(optionId: number) {
    if (inputLocked) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const nextAnswers = {
      ...answers,
      [question.id]: { ...answers[question.id], question_id: question.id, option_id: optionId },
    };
    setAnswers(nextAnswers);
    autosave(nextAnswers, question.id);

    const fromIndex = currentIndex;
    timerRef.current = setTimeout(() => {
      advanceOrFinish(nextAnswers, fromIndex);
    }, ANSWER_ADVANCE_DELAY_MS);
  }

  function handleComment(value: string) {
    const nextAnswers = {
      ...answers,
      [question.id]: { ...answers[question.id], question_id: question.id, comment: value },
    };
    setAnswers(nextAnswers);
    autosave(nextAnswers, question.id);
  }

  function toggleComment() {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(question.id)) next.delete(question.id);
      else next.add(question.id);
      return next;
    });
  }

  function handleBack() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentIndex((i) => Math.max(0, i - 1));
  }

  function handleMilestoneContinue() {
    setPendingMilestoneMessage(null);
    setPhase("question");
    setCurrentIndex((i) => i + 1);
    lockInputBriefly();
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

  if (phase === "loading") {
    return <p className="p-8 text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (phase === "intro") {
    return (
      <TestIntroScreen
        testType="snapshot"
        title={test.title}
        description={test.description}
        onStart={() => setPhase("question")}
      />
    );
  }

  if (phase === "calculating") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <p className="text-sm text-muted-foreground">{t("calculating")}</p>
      </div>
    );
  }

  if (phase === "milestone" && pendingMilestoneMessage) {
    return <MilestoneInterstitial message={pendingMilestoneMessage} onContinue={handleMilestoneContinue} />;
  }

  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="mx-auto w-full max-w-xl">
      <SaveExitControl autosaveState={autosaveState} />
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      {showResumeBanner && (
        <ResumeBanner current={currentIndex + 1} total={questions.length} />
      )}
      {ambientMessage && (
        <AmbientMilestoneBanner message={ambientMessage} onDone={() => setAmbientMessage(null)} />
      )}

      <div className="section-label mb-1 flex items-center justify-between">
        <span>{t("questionProgress", { current: currentIndex + 1, total: questions.length })}</span>
      </div>
      <Progress value={((currentIndex + 1) / questions.length) * 100} className="mb-8" />

      <CategoryBadge label={question.category_key ? categoryNameByKey[question.category_key] : null} />

      {/* Fixed-height wrapper so the answer buttons below land at the same
          vertical position regardless of how many lines a question wraps
          to — otherwise short vs. long questions visibly shift the layout
          as you page through. */}
      <div className="mb-6 flex min-h-24 items-center sm:min-h-28">
        <h2 id={headingId} className="text-xl font-semibold sm:text-2xl">
          {question.text}
        </h2>
      </div>
      {question.help_text && <p className="mb-4 text-sm text-muted-foreground">{question.help_text}</p>}
      {currentIndex === 0 && !showResumeBanner && (
        <p className="mb-4 text-xs text-muted-foreground italic">{t("firstQuestionHint")}</p>
      )}

      <div
        role="group"
        aria-labelledby={headingId}
        className="mb-6 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${question.options.length}, minmax(0, 1fr))` }}
      >
        {question.options.map((option) => {
          const active = currentAnswer?.option_id === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => handleSelect(option.id)}
              disabled={inputLocked}
              style={{ borderRadius: "2px" }}
              className={`flex flex-col items-center justify-center gap-1 border px-2 py-3 text-center text-xs font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-white/15 text-muted-foreground hover:border-primary/50 hover:text-gold"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {question.allow_comment && (
        <div className="mb-6">
          {openComments.has(question.id) || currentAnswer?.comment ? (
            <Textarea
              value={currentAnswer?.comment ?? ""}
              onChange={(e) => handleComment(e.target.value)}
              autoFocus
              placeholder=""
            />
          ) : (
            <button
              type="button"
              onClick={toggleComment}
              className="text-xs text-muted-foreground transition-colors duration-150 hover:text-gold"
            >
              + {t("addComment")}
            </button>
          )}
        </div>
      )}

      {isLastQuestion && (
        <p className="mb-4 text-xs text-gold">{t("seeResultsButton")} →</p>
      )}

      <div className="h-5">
        {currentIndex > 0 && (
          <button type="button" onClick={handleBack} className="text-xs text-muted-foreground transition-colors duration-150 hover:text-gold">
            ← {t("backButton")}
          </button>
        )}
      </div>
    </div>
  );
}
