/**
 * QuickReflectionModal — "Rychlá reflexe"
 * Fullscreen 7-question self-check. No API, no LLM — result is computed
 * locally and deterministically from the answers (see calculateScores / getResult).
 *
 * Copy lives in content.ts's `quickReflection` section (cs/en), same
 * convention as the rest of the site, and is selected by the page's own
 * language toggle via useLang() — this used to be Czech-only regardless of
 * that toggle, which is exactly the mismatch that got reported live.
 */
import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useLang, type Lang } from "@/contexts/LangContext";
import { t, tx } from "@/lib/content";
import { trackEvent } from "@/lib/analytics";

// ── Timing ───────────────────────────────────────────────────────────────────
const ANSWER_ADVANCE_DELAY_MS = 200;
const CALCULATING_DELAY_MS = 550;

// ── Questions ────────────────────────────────────────────────────────────────
interface Question {
  id: number;
  text: string;
  minLabel: string;
  maxLabel: string;
}

// Question count/order is language-independent — cs and en arrays in
// content.ts are kept the same length/order by construction, so either can
// be used to derive the count.
const QUESTION_COUNT = t.quickReflection.questions.cs.length;

function getQuestions(lang: Lang): Question[] {
  return t.quickReflection.questions[lang].map((q, i) => ({
    id: i + 1,
    ...q,
  }));
}

const SCALE = Array.from({ length: 11 }, (_, i) => i);

export type Answers = Partial<Record<number, number>>;

// ── Scoring ──────────────────────────────────────────────────────────────────
export interface Scores {
  S: number; // satisfaction
  A: number; // aspiration
  C: number; // capacity
  L: number; // load
}

export function calculateScores(answers: Answers): Scores {
  const q = (id: number) => answers[id] ?? 0;
  return {
    S: (q(1) + q(2) + q(3)) / 3,
    A: q(4),
    C: (q(5) + q(6)) / 2,
    L: q(7),
  };
}

export type ResultKey = "support" | "ok" | "growth" | "change";
const RESULT_KEYS: readonly ResultKey[] = ["support", "ok", "growth", "change"];

/** Guards against stale/incompatible data from a previous version of this
 * quiz (e.g. localStorage written before a question count/ResultKey change) —
 * without this, a result lookup crashes on an unrecognized key. */
export function isValidReflectionState(
  value: unknown
): value is { answers: Answers; result: ResultKey } {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (!RESULT_KEYS.includes(v.result as ResultKey)) return false;
  if (!v.answers || typeof v.answers !== "object") return false;
  return Object.entries(v.answers as Record<string, unknown>).every(
    ([id, val]) =>
      Number(id) >= 1 &&
      Number(id) <= QUESTION_COUNT &&
      typeof val === "number" &&
      val >= 0 &&
      val <= 10
  );
}

// Order matters: support overrides everything, then ok, then growth, then change.
export function getResult({ S, A, C, L }: Scores): ResultKey {
  if (L >= 8 && C <= 4) return "support";
  if (S >= 7 && A < 6) return "ok";
  if (S >= 7 && A >= 6) return "growth";
  return "change";
}

export function formatScore(value: number, lang: Lang = "cs"): string {
  const rounded = (Math.round(value * 10) / 10).toString();
  return lang === "cs" ? rounded.replace(".", ",") : rounded;
}

// Traces the same branches getResult() checks, in the same order, so the
// explanation can never drift out of sync with the actual decision — each
// step names the threshold, the measured value, and whether it passed.
// Composed dynamically from live numbers, so — unlike the rest of this
// file's copy — it isn't a content.ts lookup, just two parallel phrasings.
export function explainRule(scores: Scores, lang: Lang = "cs"): string {
  const { S, A, C, L } = scores;
  const supportHolds = L >= 8 && C <= 4;

  if (lang === "en") {
    const supportStep = `load L = ${formatScore(L, lang)} ${L >= 8 ? "≥" : "<"} 8 and capacity C = ${formatScore(C, lang)} ${C <= 4 ? "≤" : ">"} 4`;
    if (supportHolds) {
      return `${supportStep} → the support rule applies and takes priority over the others.`;
    }
    const satisfactionStep = `satisfaction S = ${formatScore(S, lang)} ${S >= 7 ? "≥" : "<"} 7`;
    if (S < 7) {
      return `${supportStep} → doesn't apply. ${satisfactionStep}, so it's neither OK nor growth → change remains.`;
    }
    const ambitionStep = `ambition A = ${formatScore(A, lang)} ${A >= 6 ? "≥" : "<"} 6`;
    if (A < 6) {
      return `${supportStep} → doesn't apply. ${satisfactionStep} and ${ambitionStep} → OK.`;
    }
    return `${supportStep} → doesn't apply. ${satisfactionStep} and ${ambitionStep} → growth.`;
  }

  const supportStep = `zátěž L = ${formatScore(L, lang)} ${L >= 8 ? "≥" : "<"} 8 a kapacita C = ${formatScore(C, lang)} ${C <= 4 ? "≤" : ">"} 4`;

  if (supportHolds) {
    return `${supportStep} → pravidlo pro podporu platí a má přednost před ostatními pravidly.`;
  }

  const satisfactionStep = `spokojenost S = ${formatScore(S, lang)} ${S >= 7 ? "≥" : "<"} 7`;

  if (S < 7) {
    return `${supportStep} → neplatí. ${satisfactionStep}, takže nejde o OK ani růst → zbývá změna.`;
  }

  const ambitionStep = `ambice A = ${formatScore(A, lang)} ${A >= 6 ? "≥" : "<"} 6`;

  if (A < 6) {
    return `${supportStep} → neplatí. ${satisfactionStep} a ${ambitionStep} → OK.`;
  }

  return `${supportStep} → neplatí. ${satisfactionStep} a ${ambitionStep} → růst.`;
}

// ── Result copy ──────────────────────────────────────────────────────────────
// Structural, not translatable copy — which button does what per result.
// The actual eyebrow/headline/text/labels live in content.ts's
// `quickReflection.results`, keyed [resultKey][lang].
type PrimaryAction = "close" | "growth" | "change";

const RESULT_ACTIONS: Record<ResultKey, PrimaryAction> = {
  ok: "close",
  growth: "growth",
  change: "change",
  support: "close",
};

// ── Component ────────────────────────────────────────────────────────────────
interface QuickReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrowthCTA?: () => void;
  onChangeCTA?: () => void;
  /** Fired once the quiz finishes and a result has been computed. */
  onComplete?: (answers: Answers, result: ResultKey) => void;
  /** If provided, opening the modal shows this previously computed result instead of starting the quiz. */
  initialState?: { answers: Answers; result: ResultKey };
  /** Fired when `initialState` was provided but fails validation, so the
   * caller can drop its own "done" flag (and any persisted copy) instead of
   * it staying stuck showing a result the modal itself just discarded. */
  onInvalidState?: () => void;
}

type Phase = "question" | "calculating" | "result";

export function QuickReflectionModal({
  isOpen,
  onClose,
  onGrowthCTA,
  onChangeCTA,
  onComplete,
  initialState,
  onInvalidState,
}: QuickReflectionModalProps) {
  const { lang } = useLang();
  const headingId = useId();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<ResultKey | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle"
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) return;
    if (initialState && isValidReflectionState(initialState)) {
      setAnswers(initialState.answers);
      setResult(initialState.result);
      setCurrentQuestion(QUESTION_COUNT - 1);
      setIsCalculating(false);
      setShowDetails(false);
      setCopyStatus("idle");
      trackEvent(lang, "quick_reflection_open", { resumed: true });
    } else {
      if (initialState) onInvalidState?.();
      setCurrentQuestion(0);
      setAnswers({});
      setIsCalculating(false);
      setResult(null);
      setShowDetails(false);
      setCopyStatus("idle");
      trackEvent(lang, "quick_reflection_open", { resumed: false });
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
    };
  }, []);

  const phase: Phase = result
    ? "result"
    : isCalculating
      ? "calculating"
      : "question";
  const questions = getQuestions(lang);
  const question = questions[currentQuestion];
  const currentAnswer = answers[question.id];
  const resultScores = result ? calculateScores(answers) : null;
  const resultCopy = result ? t.quickReflection.results[result][lang] : null;

  function handleSelect(value: number) {
    if (timerRef.current) clearTimeout(timerRef.current);
    const nextAnswers: Answers = { ...answers, [question.id]: value };
    setAnswers(nextAnswers);
    trackEvent(lang, "quick_reflection_answer", {
      question: question.id,
      value,
    });

    timerRef.current = setTimeout(() => {
      if (currentQuestion < QUESTION_COUNT - 1) {
        setCurrentQuestion(i => i + 1);
      } else {
        finishQuiz(nextAnswers);
      }
    }, ANSWER_ADVANCE_DELAY_MS);
  }

  function finishQuiz(finalAnswers: Answers) {
    setIsCalculating(true);
    timerRef.current = setTimeout(() => {
      const resultKey = getResult(calculateScores(finalAnswers));
      setResult(resultKey);
      setIsCalculating(false);
      trackEvent(lang, "quick_reflection_result", { result: resultKey });
      onComplete?.(finalAnswers, resultKey);
    }, CALCULATING_DELAY_MS);
  }

  function handleBack() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentQuestion(i => Math.max(0, i - 1));
  }

  function handleRestart() {
    setAnswers({});
    setCurrentQuestion(0);
    setResult(null);
    setShowDetails(false);
    setCopyStatus("idle");
    trackEvent(lang, "quick_reflection_restart", {});
  }

  async function handleCopyResults() {
    if (!result || !resultScores) return;
    const payload = {
      answers: questions.map(q => ({
        question: q.text,
        value: answers[q.id] ?? 0,
      })),
      scores: {
        satisfaction: resultScores.S,
        aspiration: resultScores.A,
        capacity: resultScores.C,
        load: resultScores.L,
      },
      result,
      explanation: explainRule(resultScores, lang),
    };

    if (copyResetRef.current) clearTimeout(copyResetRef.current);
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopyStatus("copied");
      trackEvent(lang, "quick_reflection_copy", { result });
    } catch {
      setCopyStatus("error");
    }
    copyResetRef.current = setTimeout(() => setCopyStatus("idle"), 2000);
  }

  function handlePrimary() {
    if (!result) return;
    const action = RESULT_ACTIONS[result];
    trackEvent(lang, "quick_reflection_cta", { result, action });
    onClose();
    if (action === "growth") onGrowthCTA?.();
    if (action === "change") onChangeCTA?.();
  }

  function handleSecondary() {
    if (!result) return;
    if (result === "ok") {
      handleRestart();
      return;
    }
    trackEvent(lang, "quick_reflection_close", { result });
    onClose();
  }

  const srDescription =
    phase === "question"
      ? `${tx(t.quickReflection.questionWord, lang)} ${currentQuestion + 1} ${tx(t.quickReflection.ofWord, lang)} ${QUESTION_COUNT}. ${question.text}`
      : phase === "calculating"
        ? tx(t.quickReflection.calculatingSr, lang)
        : resultCopy
          ? `${resultCopy.eyebrow} ${resultCopy.headline}`
          : "";

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <DialogPrimitive.Content
          onClick={e => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-6 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none"
        >
          <div
            className="relative my-auto w-full max-w-[700px] border p-6 shadow-2xl sm:p-10"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              borderRadius: "2px",
            }}
          >
            <DialogPrimitive.Close
              aria-label={tx(t.quickReflection.closeAriaLabel, lang)}
              className="absolute top-4 right-4 p-1.5 text-muted-foreground transition-colors duration-150 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:top-6 sm:right-6"
              style={{ borderRadius: "2px" }}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>

            <DialogPrimitive.Title
              className="mb-6 pr-8 text-sm font-semibold text-gold"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {tx(t.quickReflection.title, lang)}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              {srDescription}
            </DialogPrimitive.Description>

            <div aria-live="polite">
              {phase === "question" && (
                <div>
                  <div
                    className="mb-1 flex items-center justify-between text-xs"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "var(--muted-foreground)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <span>{tx(t.quickReflection.questionsCount, lang)}</span>
                    <span>
                      {currentQuestion + 1} / {QUESTION_COUNT}
                    </span>
                  </div>
                  <div
                    className="mb-8 h-1 w-full overflow-hidden bg-white/10"
                    style={{ borderRadius: "2px" }}
                  >
                    <div
                      className="h-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
                      style={{
                        width: `${((currentQuestion + 1) / QUESTION_COUNT) * 100}%`,
                      }}
                    />
                  </div>

                  <h2
                    id={headingId}
                    className="mb-8 text-xl font-semibold text-foreground sm:text-2xl"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {question.text}
                  </h2>

                  <div
                    role="group"
                    aria-labelledby={headingId}
                    className="mb-4 grid grid-cols-11 gap-1 sm:gap-2"
                  >
                    {SCALE.map(value => {
                      const active = currentAnswer === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => handleSelect(value)}
                          className={`aspect-square flex items-center justify-center text-[0.65rem] font-medium border transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-sm ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-white/15 text-muted-foreground hover:border-primary/50 hover:text-gold"
                          }`}
                          style={{ borderRadius: "2px" }}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className="mb-2 flex items-center justify-between text-xs text-muted-foreground"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <span>{question.minLabel}</span>
                    <span>{question.maxLabel}</span>
                  </div>

                  <div className="mt-6 h-5">
                    {currentQuestion > 0 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="text-xs text-muted-foreground transition-colors duration-150 hover:text-gold"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        ← {tx(t.quickReflection.back, lang)}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {phase === "calculating" && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div
                    className="mb-4 h-8 w-8 animate-spin motion-reduce:animate-none"
                    style={{
                      borderRadius: "9999px",
                      border: "2px solid oklch(0.78 0.12 85 / 30%)",
                      borderTopColor: "var(--gold)",
                    }}
                  />
                  <p
                    className="text-sm text-muted-foreground"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {tx(t.quickReflection.calculating, lang)}
                  </p>
                </div>
              )}

              {phase === "result" && result && resultCopy && (
                <div>
                  <p
                    className="mb-3 text-xs text-gold uppercase"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.15em",
                    }}
                  >
                    {resultCopy.eyebrow}
                  </p>
                  <h2
                    className="mb-4 text-2xl font-bold text-foreground sm:text-3xl"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {resultCopy.headline}
                  </h2>
                  <p
                    className="mb-8 text-sm leading-relaxed text-muted-foreground sm:text-base"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 300,
                    }}
                  >
                    {resultCopy.text}
                  </p>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handlePrimary}
                      className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold transition-opacity duration-150 hover:opacity-90"
                      style={{
                        background: "var(--gold)",
                        color: "oklch(0.12 0.015 60)",
                        fontFamily: "'DM Sans', sans-serif",
                        borderRadius: "2px",
                      }}
                    >
                      {resultCopy.primaryLabel}
                    </button>
                    {resultCopy.secondaryLabel && (
                      <button
                        type="button"
                        onClick={handleSecondary}
                        className="inline-flex items-center justify-center px-6 py-3 text-sm text-muted-foreground transition-colors duration-150 hover:text-gold"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {resultCopy.secondaryLabel}
                      </button>
                    )}
                  </div>

                  {resultCopy.footnote && (
                    <p
                      className="mt-6 text-xs leading-relaxed text-muted-foreground/70"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {resultCopy.footnote}
                    </p>
                  )}

                  {resultScores && (
                    <div
                      className="mt-8 border-t pt-6"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <p
                        className="mb-4 text-[0.65rem] text-muted-foreground uppercase"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          letterSpacing: "0.2em",
                        }}
                      >
                        {tx(t.quickReflection.yourAnswers, lang)}
                      </p>
                      <div className="grid grid-cols-[minmax(0,8rem)_1fr_1.5rem] items-center gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,18rem)_1fr_1.5rem]">
                        {questions.map(q => {
                          const value = answers[q.id] ?? 0;
                          return (
                            <Fragment key={q.id}>
                              <span
                                className="truncate text-xs text-muted-foreground"
                                title={q.text}
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              >
                                {q.text}
                              </span>
                              <div
                                className="h-2 overflow-hidden bg-white/10"
                                style={{ borderRadius: "2px" }}
                              >
                                <div
                                  className="h-full bg-primary"
                                  style={{ width: `${(value / 10) * 100}%` }}
                                />
                              </div>
                              <span
                                className="text-right text-xs text-foreground tabular-nums"
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                }}
                              >
                                {value}
                              </span>
                            </Fragment>
                          );
                        })}
                      </div>
                      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <button
                          type="button"
                          onClick={() => setShowDetails(v => !v)}
                          aria-expanded={showDetails}
                          className="text-[0.7rem] text-muted-foreground/80 underline decoration-dotted underline-offset-2 transition-colors duration-150 hover:text-gold"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {showDetails
                            ? tx(t.quickReflection.hideDetails, lang)
                            : tx(t.quickReflection.showDetails, lang)}
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyResults}
                          className="text-[0.7rem] text-muted-foreground/80 underline decoration-dotted underline-offset-2 transition-colors duration-150 hover:text-gold"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {copyStatus === "copied"
                            ? tx(t.quickReflection.copied, lang)
                            : copyStatus === "error"
                              ? tx(t.quickReflection.copyFailed, lang)
                              : tx(t.quickReflection.copyResult, lang)}
                        </button>
                      </div>

                      {showDetails && (
                        <div
                          className="mt-3 space-y-2 text-[0.7rem] leading-relaxed text-muted-foreground/80"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          <p>
                            {t.quickReflection.scoreLabels[lang].S} (S): {formatScore(resultScores.S, lang)} ·{" "}
                            {t.quickReflection.scoreLabels[lang].A} (A): {formatScore(resultScores.A, lang)} ·{" "}
                            {t.quickReflection.scoreLabels[lang].C} (C): {formatScore(resultScores.C, lang)} ·{" "}
                            {t.quickReflection.scoreLabels[lang].L} (L): {formatScore(resultScores.L, lang)}
                          </p>
                          <p>{explainRule(resultScores, lang)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
