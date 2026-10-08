import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { getDraft, patchDraft, submitTest } from "@/lib/api";
import { useTranslation, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AnswerInput, TestDetail, TestSubmission } from "@/types/api";

import { AmbientMilestoneBanner } from "./AmbientMilestoneBanner";
import { CategoryBadge } from "./CategoryBadge";
import { MilestoneInterstitial } from "./MilestoneInterstitial";
import { ResumeBanner } from "./ResumeBanner";
import { SaveExitControl, type AutosaveState } from "./SaveExitControl";

// One statement per screen with a progress bar, following SnapshotTest's
// flow (auto-advance, brief input lock, milestones, resume banner). What
// differs: every item can be N/A or skipped outright, the last item never
// auto-submits (submitting with gaps is allowed, so it's an explicit
// button), and an open comment box pauses auto-advance so the user isn't
// whisked away mid-thought.
const ANSWER_ADVANCE_DELAY_MS = 350;
const INPUT_LOCK_MS = 200;
// Typing a comment autosaves once the user pauses, not on every keystroke.
const COMMENT_SAVE_DELAY_MS = 600;

type Phase = "loading" | "intro" | "question" | "milestone";

// An answer is either a chosen option, an explicit N/A, or absent (not yet
// answered / cleared). "Absent" is recorded as "skipped" on the server.
type Choice = { kind: "option"; optionId: number } | { kind: "na" };

interface Props {
  test: TestDetail;
  onComplete: (submission: TestSubmission) => void;
  isEditing?: boolean;
}

export const DOMAIN_KEYS = ["S", "C", "A", "R", "F"] as const;

export function domainTitleKey(domain: string): TranslationKey {
  return `scarfDomain${domain}` as TranslationKey;
}

// Domains with a clarifying note under their description (see issue #24).
const DOMAIN_NOTES: Record<string, TranslationKey> = {
  A: "scarfDomainANote",
  F: "scarfDomainFNote",
};

function fractionIndex(total: number, fraction: number): number {
  return Math.round(total * fraction) - 1;
}

export function ReflectionTest({ test, onComplete, isEditing = false }: Props) {
  const { t } = useTranslation();
  const headingId = useId();
  // The server orders questions domain -> pair -> experience/contribution.
  const questions = useMemo(
    () => test.questions.filter((q) => q.config.domain && q.config.role),
    [test.questions],
  );

  const [phase, setPhase] = useState<Phase>("loading");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choices, setChoices] = useState<Record<number, Choice>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [openComments, setOpenComments] = useState<Set<number>>(new Set());
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [ambientMessage, setAmbientMessage] = useState<string | null>(null);
  const [pendingMilestoneMessage, setPendingMilestoneMessage] = useState<string | null>(null);
  const [inputLocked, setInputLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commentTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const seenMilestonesRef = useRef<Set<number>>(new Set());

  const thirtyPercentIndex = fractionIndex(questions.length, 0.3);
  const sixtyPercentIndex = fractionIndex(questions.length, 0.6);
  const ninetyPercentIndex = fractionIndex(questions.length, 0.9);

  useEffect(() => {
    let cancelled = false;
    getDraft(test.slug).then((draft) => {
      if (cancelled) return;
      const loaded: Record<number, Choice> = {};
      const loadedComments: Record<number, string> = {};
      for (const a of draft.answers) {
        if (a.comment) loadedComments[a.question_id] = a.comment;
        if (a.response_state === "not_applicable") loaded[a.question_id] = { kind: "na" };
        else if (a.response_state === "answered" && a.selected_option_id !== null)
          loaded[a.question_id] = { kind: "option", optionId: a.selected_option_id };
      }
      setChoices(loaded);
      setComments(loadedComments);

      // Any saved row (even a cleared/skipped one) means the item was seen,
      // so resume at the first item never touched.
      const seen = new Set(draft.answers.map((a) => a.question_id));
      const firstUnseenIndex = questions.findIndex((q) => !seen.has(q.id));
      const hasAnyAnswers = draft.answers.length > 0;
      setCurrentIndex(firstUnseenIndex === -1 ? 0 : firstUnseenIndex);
      setShowResumeBanner(hasAnyAnswers && firstUnseenIndex !== -1 && !isEditing);
      setPhase(hasAnyAnswers ? "question" : "intro");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test.slug]);

  useEffect(() => {
    const timers = commentTimers.current;
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // The server overwrites the whole answer row on every save, so the choice
  // and the comment always travel together.
  function toInput(questionId: number, choice: Choice | undefined, comment = ""): AnswerInput {
    if (!choice) return { question_id: questionId, response_state: "skipped", comment };
    if (choice.kind === "na") return { question_id: questionId, response_state: "not_applicable", comment };
    return { question_id: questionId, option_id: choice.optionId, comment };
  }

  function save(input: AnswerInput) {
    setAutosaveState("saving");
    patchDraft(test.slug, [input])
      .then(() => setAutosaveState("saved"))
      .catch(() => setAutosaveState("idle"));
  }

  function lockInputBriefly() {
    setInputLocked(true);
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(() => setInputLocked(false), INPUT_LOCK_MS);
  }

  function goNext(fromIndex: number) {
    if (fromIndex >= questions.length - 1) return;
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
    setShowResumeBanner(false);
    setCurrentIndex(fromIndex + 1);
    lockInputBriefly();
  }

  function choose(choice: Choice | undefined) {
    if (inputLocked) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const questionId = question.id;
    setChoices((prev) => {
      const next = { ...prev };
      if (choice) next[questionId] = choice;
      else delete next[questionId];
      return next;
    });
    clearTimeout(commentTimers.current[questionId]);
    save(toInput(questionId, choice, comments[questionId]));

    if (choice && !openComments.has(questionId) && !comments[questionId]) {
      const fromIndex = currentIndex;
      timerRef.current = setTimeout(() => goNext(fromIndex), ANSWER_ADVANCE_DELAY_MS);
    }
  }

  function editComment(value: string) {
    const questionId = question.id;
    const choice = choices[questionId];
    setComments((prev) => ({ ...prev, [questionId]: value }));
    clearTimeout(commentTimers.current[questionId]);
    commentTimers.current[questionId] = setTimeout(
      () => save(toInput(questionId, choice, value)),
      COMMENT_SAVE_DELAY_MS,
    );
  }

  function openComment() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpenComments((prev) => new Set(prev).add(question.id));
  }

  function handleBack() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentIndex((i) => Math.max(0, i - 1));
  }

  function handleForward() {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Record a deliberate skip so resuming lands past it, not back on it.
    if (!choices[question.id] && !comments[question.id]) save(toInput(question.id, undefined));
    goNext(currentIndex);
  }

  function handleMilestoneContinue() {
    setPendingMilestoneMessage(null);
    setPhase("question");
    setCurrentIndex((i) => i + 1);
    lockInputBriefly();
  }

  async function handleSubmit() {
    if (timerRef.current) clearTimeout(timerRef.current);
    Object.values(commentTimers.current).forEach(clearTimeout);
    setSubmitting(true);
    setError(null);
    try {
      const answers = questions.map((q) => toInput(q.id, choices[q.id], comments[q.id]));
      onComplete(await submitTest(test.slug, answers));
    } catch {
      setError(t("submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "loading") return <p className="p-8 text-sm text-muted-foreground">{t("loading")}</p>;

  if (phase === "intro") {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <h1 className="text-xl font-semibold">{test.title}</h1>
        <p className="whitespace-pre-line text-sm text-muted-foreground">{test.description}</p>
        <p className="whitespace-pre-line text-sm text-muted-foreground">{test.instructions}</p>

        <section aria-labelledby="scarf-scale">
          <h2 id="scarf-scale" className="mb-2 text-sm font-semibold">
            {t("scarfScaleHeading")}
          </h2>
          <ul className="flex flex-col gap-1 text-sm">
            {test.questions[0]?.options.map((o) => (
              <li key={o.id} className="flex gap-3">
                <span className="w-5 shrink-0 font-medium tabular-nums">{o.value}</span>
                <span className="text-muted-foreground">{o.label}</span>
              </li>
            ))}
            <li className="flex gap-3">
              <span className="w-5 shrink-0 font-medium">{t("scarfNotApplicable")}</span>
              <span className="text-muted-foreground">{t("scarfNotApplicableLong")}</span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">{t("scarfSkipHint")}</p>
        </section>

        <section className="rounded-md border p-4">
          <h2 className="mb-1 text-sm font-semibold">{t("scarfPrivacyHeading")}</h2>
          <p className="text-sm text-muted-foreground">{t("scarfPrivacy")}</p>
        </section>

        <p className="section-label">{t("introTimeEstimateReflection")}</p>
        <Button onClick={() => setPhase("question")} className="self-start">
          {t("startTest")}
        </Button>
      </div>
    );
  }

  if (phase === "milestone" && pendingMilestoneMessage) {
    return <MilestoneInterstitial message={pendingMilestoneMessage} onContinue={handleMilestoneContinue} />;
  }

  const domain = question.config.domain!;
  const choice = choices[question.id];
  const comment = comments[question.id] ?? "";
  const options = question.options;
  const selectedLabel = choice?.kind === "option" ? options.find((o) => o.id === choice.optionId)?.label : undefined;

  function pillClass(selected: boolean) {
    return cn(
      "flex h-12 items-center justify-center border text-base font-medium tabular-nums transition-colors duration-150 select-none",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default",
      selected
        ? "border-primary bg-primary text-primary-foreground"
        : "border-white/15 text-muted-foreground hover:border-primary/50 hover:text-gold",
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <SaveExitControl autosaveState={autosaveState} />
      {error && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {error}
        </p>
      )}
      {showResumeBanner && <ResumeBanner current={currentIndex + 1} total={questions.length} />}
      {ambientMessage && <AmbientMilestoneBanner message={ambientMessage} onDone={() => setAmbientMessage(null)} />}

      <div className="section-label mb-1 flex items-center justify-between">
        <span>{t("questionProgress", { current: currentIndex + 1, total: questions.length })}</span>
      </div>
      <Progress value={((currentIndex + 1) / questions.length) * 100} className="mb-8" />

      <CategoryBadge label={t(domainTitleKey(domain))} />
      <p className="text-xs text-muted-foreground">{t(`${domainTitleKey(domain)}Desc` as TranslationKey)}</p>
      {DOMAIN_NOTES[domain] && <p className="mt-1 text-xs text-muted-foreground">{t(DOMAIN_NOTES[domain])}</p>}

      {/* Fixed-height wrapper so the scale lands at the same vertical
          position however many lines the statement wraps to (as in
          SnapshotTest). */}
      <div className="mt-6 mb-6 flex min-h-28 flex-col justify-center sm:min-h-32">
        <span className="section-label mb-2 block text-gold">
          {t(question.config.role === "experience" ? "scarfExperience" : "scarfContribution")}
        </span>
        <h2 id={headingId} className="text-xl font-semibold sm:text-2xl">
          {question.text}
        </h2>
      </div>
      {currentIndex === 0 && !showResumeBanner && (
        <p className="mb-4 text-xs text-muted-foreground italic">{t("scarfSkipHint")}</p>
      )}

      <div role="group" aria-labelledby={headingId} className="flex flex-col gap-2">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {options.map((o) => {
            const active = choice?.kind === "option" && choice.optionId === o.id;
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={active}
                aria-label={`${o.value}: ${o.label}`}
                title={o.label}
                onClick={() => choose({ kind: "option", optionId: o.id })}
                disabled={inputLocked}
                style={{ borderRadius: "2px" }}
                className={pillClass(active)}
              >
                {o.value}
              </button>
            );
          })}
        </div>

        {options.length > 1 && (
          <div className="flex justify-between gap-4 text-[11px] leading-tight text-muted-foreground" aria-hidden="true">
            <span className="max-w-[45%]">{options[0].label}</span>
            <span className="max-w-[45%] text-right">{options[options.length - 1].label}</span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            aria-pressed={choice?.kind === "na"}
            aria-label={`${t("scarfNotApplicable")}: ${t("scarfNotApplicableLong")}`}
            title={t("scarfNotApplicableLong")}
            onClick={() => choose({ kind: "na" })}
            disabled={inputLocked}
            style={{ borderRadius: "2px" }}
            className={cn(pillClass(choice?.kind === "na"), "h-10 shrink-0 px-4 text-xs")}
          >
            {t("scarfNotApplicable")}
          </button>
          <span className="min-w-0 flex-1 text-xs text-muted-foreground" aria-live="polite">
            {selectedLabel ?? (choice?.kind === "na" ? t("scarfNotApplicableLong") : "")}
          </span>
          {choice && (
            <button
              type="button"
              className="shrink-0 py-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              onClick={() => choose(undefined)}
            >
              {t("scarfClear")}
            </button>
          )}
        </div>
      </div>

      {question.allow_comment && (
        <div className="mt-5 mb-6">
          {openComments.has(question.id) || comment ? (
            <Textarea
              value={comment}
              onChange={(e) => editComment(e.target.value)}
              autoFocus={!comment}
              aria-label={`${t("commentLabel")}: ${question.text}`}
              className="min-h-20"
            />
          ) : (
            <button
              type="button"
              onClick={openComment}
              className="py-1 text-xs text-muted-foreground transition-colors duration-150 hover:text-gold"
            >
              + {t("addComment")}
            </button>
          )}
        </div>
      )}

      {isLastQuestion && (
        <div className="mb-6 flex flex-col gap-2 border-t pt-6">
          <p className="text-xs text-muted-foreground">{t("scarfSubmitHint")}</p>
          <Button onClick={handleSubmit} disabled={submitting} className="self-start">
            {isEditing ? t("saveChanges") : t("scarfSubmit")}
          </Button>
        </div>
      )}

      <div className="flex h-8 items-center justify-between">
        <span>
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="py-1 text-xs text-muted-foreground transition-colors duration-150 hover:text-gold"
            >
              ← {t("backButton")}
            </button>
          )}
        </span>
        {!isLastQuestion && (
          <button
            type="button"
            onClick={handleForward}
            className="py-1 text-xs text-muted-foreground transition-colors duration-150 hover:text-gold"
          >
            {choice || comment ? t("nextButton") : t("scarfSkipQuestion")} →
          </button>
        )}
      </div>
    </div>
  );
}
