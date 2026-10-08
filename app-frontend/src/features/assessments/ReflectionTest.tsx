import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { getDraft, patchDraft, submitTest } from "@/lib/api";
import { useTranslation, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AnswerInput, Question, TestDetail, TestSubmission } from "@/types/api";

import { SaveExitControl, type AutosaveState } from "./SaveExitControl";

type Phase = "loading" | "intro" | "form";

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

export function ReflectionTest({ test, onComplete, isEditing = false }: Props) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("loading");
  const [choices, setChoices] = useState<Record<number, Choice>>({});
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
      for (const a of draft.answers) {
        if (a.response_state === "not_applicable") loaded[a.question_id] = { kind: "na" };
        else if (a.response_state === "answered" && a.selected_option_id !== null)
          loaded[a.question_id] = { kind: "option", optionId: a.selected_option_id };
      }
      setChoices(loaded);
      setPhase(draft.answers.length > 0 ? "form" : "intro");
    });
    return () => {
      cancelled = true;
    };
  }, [test.slug]);

  function toInput(questionId: number, choice: Choice | undefined): AnswerInput {
    if (!choice) return { question_id: questionId, response_state: "skipped" };
    if (choice.kind === "na") return { question_id: questionId, response_state: "not_applicable" };
    return { question_id: questionId, option_id: choice.optionId };
  }

  function choose(questionId: number, choice: Choice | undefined) {
    setChoices((prev) => {
      const next = { ...prev };
      if (choice) next[questionId] = choice;
      else delete next[questionId];
      return next;
    });
    setAutosaveState("saving");
    patchDraft(test.slug, [toInput(questionId, choice)])
      .then(() => setAutosaveState("saved"))
      .catch(() => setAutosaveState("idle"));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const answers = test.questions.map((q) => toInput(q.id, choices[q.id]));
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
            <div key={pair} className="flex flex-col gap-5 rounded-lg border p-4">
              {(["experience", "contribution"] as const).map((role) => {
                const q = items[role];
                return q ? (
                  <RatingItem
                    key={q.id}
                    question={q}
                    perspective={t(role === "experience" ? "scarfExperience" : "scarfContribution")}
                    choice={choices[q.id]}
                    onChoose={(c) => choose(q.id, c)}
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
}

// A native radio group per statement: arrow keys, Tab and Space work for
// free, and nothing is preselected. The perspective label is part of the
// legend so it is announced and visible on every screen width.
function RatingItem({ question, perspective, choice, onChoose }: RatingItemProps) {
  const { t } = useTranslation();
  const name = `q-${question.id}`;
  const selectedLabel =
    choice?.kind === "option" ? question.options.find((o) => o.id === choice.optionId)?.label : undefined;

  function pillClass(selected: boolean) {
    return cn(
      "flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-md border px-3 text-sm tabular-nums transition-colors",
      "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
      selected ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
    );
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm">
        <span className="section-label mb-1 block">{perspective}</span>
        <span className="font-medium">{question.text}</span>
      </legend>

      <div className="flex flex-wrap gap-2">
        {question.options.map((o) => {
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
        <div className="relative">
          <input
            type="radio"
            id={`${name}-na`}
            name={name}
            className="peer sr-only"
            checked={choice?.kind === "na"}
            onChange={() => onChoose({ kind: "na" })}
          />
          <label htmlFor={`${name}-na`} className={pillClass(choice?.kind === "na")} title={t("scarfNotApplicableLong")}>
            <span aria-hidden="true">{t("scarfNotApplicable")}</span>
            <span className="sr-only">{`${t("scarfNotApplicable")}: ${t("scarfNotApplicableLong")}`}</span>
          </label>
        </div>
      </div>

      <div className="flex min-h-6 items-center justify-between gap-3 text-xs text-muted-foreground" aria-live="polite">
        <span>{selectedLabel ?? (choice?.kind === "na" ? t("scarfNotApplicableLong") : "")}</span>
        {choice && (
          <button
            type="button"
            className="underline underline-offset-2 hover:text-foreground"
            onClick={() => onChoose(undefined)}
          >
            {t("scarfClear")}
          </button>
        )}
      </div>
    </fieldset>
  );
}
