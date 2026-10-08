import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getDraft, patchDraft, submitTest } from "@/lib/api";
import { useTranslation, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AnswerInput, Question, TestDetail, TestSubmission } from "@/types/api";

import { SaveExitControl, type AutosaveState } from "./SaveExitControl";

type Phase = "loading" | "intro" | "form";

// An answer is either a chosen option, an explicit N/A, or absent (not yet
// answered / cleared). "Absent" is recorded as "skipped" on the server.
type Choice = { kind: "option"; optionId: number } | { kind: "na" };

// Typing a comment autosaves once the user pauses, not on every keystroke.
const COMMENT_SAVE_DELAY_MS = 600;

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

export function ReflectionTest({ test, onComplete, isEditing = false }: Props) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("loading");
  const [choices, setChoices] = useState<Record<number, Choice>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const commentTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // domain -> pair -> { experience, contribution }; the server orders questions.
  const grouped = useMemo(() => {
    const domains = new Map<string, Map<string, Partial<Record<"experience" | "contribution", Question>>>>();
    for (const q of test.questions) {
      const { domain, pair, role } = q.config;
      if (!domain || !pair || !role) continue;
      const pairs = domains.get(domain) ?? new Map();
      pairs.set(pair, { ...pairs.get(pair), [role]: q });
      domains.set(domain, pairs);
    }
    return domains;
  }, [test.questions]);

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
      setPhase(draft.answers.length > 0 ? "form" : "intro");
    });
    return () => {
      cancelled = true;
    };
  }, [test.slug]);

  useEffect(() => {
    const timers = commentTimers.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

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

  function choose(questionId: number, choice: Choice | undefined) {
    setChoices((prev) => {
      const next = { ...prev };
      if (choice) next[questionId] = choice;
      else delete next[questionId];
      return next;
    });
    clearTimeout(commentTimers.current[questionId]);
    save(toInput(questionId, choice, comments[questionId]));
  }

  function editComment(questionId: number, comment: string) {
    setComments((prev) => ({ ...prev, [questionId]: comment }));
    clearTimeout(commentTimers.current[questionId]);
    const choice = choices[questionId];
    commentTimers.current[questionId] = setTimeout(
      () => save(toInput(questionId, choice, comment)),
      COMMENT_SAVE_DELAY_MS,
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    Object.values(commentTimers.current).forEach(clearTimeout);
    try {
      const answers = test.questions.map((q) => toInput(q.id, choices[q.id], comments[q.id]));
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
        <Button onClick={() => setPhase("form")} className="self-start">
          {t("startTest")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10">
      <div>
        <SaveExitControl autosaveState={autosaveState} />
        <h1 className="text-xl font-semibold">{test.title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{t("scarfSkipHint")}</p>
      </div>

      {DOMAIN_KEYS.filter((d) => grouped.has(d)).map((domain) => (
        <section key={domain} aria-labelledby={`domain-${domain}`} className="flex flex-col gap-4">
          <div>
            <h2 id={`domain-${domain}`} className="text-base font-semibold">
              {t(domainTitleKey(domain))}
            </h2>
            <p className="text-sm text-muted-foreground">{t(`${domainTitleKey(domain)}Desc` as TranslationKey)}</p>
            {DOMAIN_NOTES[domain] && (
              <p className="mt-1 text-xs text-muted-foreground">{t(DOMAIN_NOTES[domain])}</p>
            )}
          </div>

          {Array.from(grouped.get(domain)!.entries()).map(([pair, items]) => (
            <div key={pair} className="flex flex-col gap-6 rounded-lg border p-3 sm:p-4">
              {(["experience", "contribution"] as const).map((role) => {
                const q = items[role];
                return q ? (
                  <RatingItem
                    key={q.id}
                    question={q}
                    perspective={t(role === "experience" ? "scarfExperience" : "scarfContribution")}
                    choice={choices[q.id]}
                    onChoose={(c) => choose(q.id, c)}
                    comment={comments[q.id] ?? ""}
                    onComment={(text) => editComment(q.id, text)}
                  />
                ) : null;
              })}
            </div>
          ))}
        </section>
      ))}

      <div className="flex flex-col gap-2 border-t pt-6">
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{t("scarfSubmitHint")}</p>
        <Button onClick={handleSubmit} disabled={submitting} className="self-start">
          {isEditing ? t("saveChanges") : t("scarfSubmit")}
        </Button>
      </div>
    </div>
  );
}

interface RatingItemProps {
  question: Question;
  perspective: string;
  choice: Choice | undefined;
  onChoose: (choice: Choice | undefined) => void;
  comment: string;
  onComment: (comment: string) => void;
}

// A native radio group per statement: arrow keys, Tab and Space work for
// free, and nothing is preselected. The perspective label is part of the
// legend so it is announced and visible on every screen width. The 1-7
// scale is a fixed 7-column grid so it stays one row down to ~320px
// phones; N/A sits on its own row since it isn't a point on the scale.
function RatingItem({ question, perspective, choice, onChoose, comment, onComment }: RatingItemProps) {
  const { t } = useTranslation();
  const [commentOpen, setCommentOpen] = useState(false);
  const name = `q-${question.id}`;
  const options = question.options;
  const selectedLabel =
    choice?.kind === "option" ? options.find((o) => o.id === choice.optionId)?.label : undefined;

  function pillClass(selected: boolean) {
    return cn(
      "flex h-11 cursor-pointer items-center justify-center rounded-md border text-sm tabular-nums transition-colors select-none",
      "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
      selected ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
    );
  }

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-1 text-sm">
        <span className="section-label mb-1 block">{perspective}</span>
        <span className="font-medium">{question.text}</span>
      </legend>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {options.map((o) => {
          const selected = choice?.kind === "option" && choice.optionId === o.id;
          return (
            <div key={o.id} className="relative">
              <input
                type="radio"
                id={`${name}-${o.id}`}
                name={name}
                className="peer sr-only"
                checked={selected}
                onChange={() => onChoose({ kind: "option", optionId: o.id })}
              />
              <label htmlFor={`${name}-${o.id}`} className={pillClass(selected)} title={o.label}>
                <span aria-hidden="true">{o.value}</span>
                <span className="sr-only">{`${o.value}: ${o.label}`}</span>
              </label>
            </div>
          );
        })}
      </div>

      {options.length > 1 && (
        <div className="flex justify-between gap-4 text-[11px] leading-tight text-muted-foreground" aria-hidden="true">
          <span className="max-w-[45%]">{options[0].label}</span>
          <span className="max-w-[45%] text-right">{options[options.length - 1].label}</span>
        </div>
      )}

      <div className="mt-1 flex items-center gap-3">
        <div className="relative shrink-0">
          <input
            type="radio"
            id={`${name}-na`}
            name={name}
            className="peer sr-only"
            checked={choice?.kind === "na"}
            onChange={() => onChoose({ kind: "na" })}
          />
          <label
            htmlFor={`${name}-na`}
            className={cn(pillClass(choice?.kind === "na"), "h-9 px-3 text-xs")}
            title={t("scarfNotApplicableLong")}
          >
            <span aria-hidden="true">{t("scarfNotApplicable")}</span>
            <span className="sr-only">{`${t("scarfNotApplicable")}: ${t("scarfNotApplicableLong")}`}</span>
          </label>
        </div>
        <span className="min-w-0 flex-1 text-xs text-muted-foreground" aria-live="polite">
          {selectedLabel ?? (choice?.kind === "na" ? t("scarfNotApplicableLong") : "")}
        </span>
        {choice && (
          <button
            type="button"
            className="shrink-0 py-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            onClick={() => onChoose(undefined)}
          >
            {t("scarfClear")}
          </button>
        )}
      </div>

      {question.allow_comment &&
        (commentOpen || comment ? (
          <Textarea
            value={comment}
            onChange={(e) => onComment(e.target.value)}
            autoFocus={commentOpen && !comment}
            aria-label={`${t("commentLabel")}: ${question.text}`}
            className="min-h-16"
          />
        ) : (
          <button
            type="button"
            onClick={() => setCommentOpen(true)}
            className="self-start py-1 text-xs text-muted-foreground transition-colors duration-150 hover:text-gold"
          >
            + {t("addComment")}
          </button>
        ))}
    </fieldset>
  );
}
