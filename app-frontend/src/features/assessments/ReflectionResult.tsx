import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getReflectionText, saveReflectionText } from "@/lib/api";
import { useTranslation, type TranslationKey } from "@/lib/i18n";
import type { ReflectionCell, ReflectionText, TestDetail, TestSubmission } from "@/types/api";

import { DOMAIN_KEYS, domainTitleKey } from "./ReflectionTest";

const PROMPTS = [
  ["situation", "scarfPromptSituation"],
  ["exception", "scarfPromptException"],
  ["missing", "scarfPromptMissing"],
] as const satisfies readonly (readonly [string, TranslationKey])[];

interface Props {
  test: TestDetail;
  submission: TestSubmission;
}

// Deliberately neutral: no colour judgments, no ranking, no totals. Each
// domain/perspective cell is shown on its own, with how many items backed it.
export function ReflectionResult({ test, submission }: Props) {
  const { t } = useTranslation();
  const cells = submission.computed_result.reflection ?? {};
  const domains = DOMAIN_KEYS.filter((d) => cells[d]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <h1 className="text-xl font-semibold">{t("scarfResultsTitle")}</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">{test.title}</caption>
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th scope="col" className="py-2 pr-3 font-medium">{t("scarfColDomain")}</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">{t("scarfColExperience")}</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">{t("scarfColContribution")}</th>
            </tr>
          </thead>
          <tbody>
            {domains.map((d) => (
              <tr key={d} className="border-b align-top">
                <th scope="row" className="py-3 pr-3 text-left font-medium">{t(domainTitleKey(d)).split(":")[0]}</th>
                <td className="px-3 py-3 text-right"><Cell cell={cells[d].experience} /></td>
                <td className="px-3 py-3 text-right"><Cell cell={cells[d].contribution} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="flex flex-col gap-2 text-sm text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">{t("scarfExplainHeading")}</h2>
        <p>{t("scarfExplain1")}</p>
        <p>{t("scarfExplain2")}</p>
        <p>{t("scarfExplain3")}</p>
        <p>{t("scarfExplain4")}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">{t("scarfYourAnswers")}</h2>
        {domains.map((d) => (
          <DomainAnswers key={d} domain={d} test={test} submission={submission} />
        ))}
      </section>

      <section className="flex flex-col gap-2 text-sm text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">{t("scarfDifferencesHeading")}</h2>
        <p>{t("scarfDifferences1")}</p>
        <p>{t("scarfDifferences2")}</p>
        <p>{t("scarfDifferences3")}</p>
      </section>

      <WrittenReflection submissionId={submission.id} domains={domains} />

      <section className="flex flex-col gap-2 border-t pt-4 text-xs text-muted-foreground">
        <p>{t("scarfPrivacy")}</p>
        <p>{t("scarfLimitations")}</p>
      </section>
    </div>
  );
}

function Cell({ cell }: { cell: ReflectionCell }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-end gap-0.5">
      {cell.mean === null ? (
        <span className="text-muted-foreground">{t("scarfNotEnoughInfo")}</span>
      ) : (
        <span className="text-base font-semibold tabular-nums">{cell.mean.toFixed(1)}</span>
      )}
      <span className="text-xs text-muted-foreground">{t("scarfRatedCount", { n: cell.rated })}</span>
    </div>
  );
}

function DomainAnswers({ domain, test, submission }: { domain: string; test: TestDetail; submission: TestSubmission }) {
  const { t } = useTranslation();
  const byQuestion = new Map(submission.answers.map((a) => [a.question_id, a]));
  const questions = test.questions.filter((q) => q.config.domain === domain);

  return (
    <details className="rounded-md border p-3">
      <summary className="cursor-pointer text-sm font-medium">{t(domainTitleKey(domain))}</summary>
      <ul className="mt-3 flex flex-col gap-3">
        {questions.map((q) => {
          const a = byQuestion.get(q.id);
          const value =
            a?.response_state === "not_applicable"
              ? t("scarfStateNotApplicable")
              : a?.response_state === "answered" && a.selected_option_label
                ? `${q.options.find((o) => o.id === a.selected_option_id)?.value}: ${a.selected_option_label}`
                : t("scarfStateSkipped");
          return (
            <li key={q.id} className="text-sm">
              <span className="section-label block">
                {t(q.config.role === "experience" ? "scarfExperience" : "scarfContribution")}
              </span>
              <span className="block">{q.text}</span>
              <span className="block text-muted-foreground">{value}</span>
              {a?.comment && (
                <span className="mt-1 block whitespace-pre-line text-xs text-muted-foreground italic">
                  {t("commentLabel")}: {a.comment}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function WrittenReflection({ submissionId, domains }: { submissionId: number; domains: string[] }) {
  const { t } = useTranslation();
  const [text, setText] = useState<ReflectionText>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    getReflectionText(submissionId).then(setText).catch(() => undefined);
  }, [submissionId]);

  function update(domain: string, prompt: string, value: string) {
    setSaved(false);
    setText((prev) => ({
      ...prev,
      [domain]: { ...(prev[domain] ?? { situation: "", exception: "", missing: "" }), [prompt]: value },
    }));
  }

  async function save() {
    setError(false);
    try {
      setText(await saveReflectionText(submissionId, text));
      setSaved(true);
    } catch {
      setError(true);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{t("scarfReflectionHeading")}</h2>
      <p className="text-sm text-muted-foreground">{t("scarfReflectionIntro")}</p>
      {domains.map((d) => (
        <details key={d} className="rounded-md border p-3">
          <summary className="cursor-pointer text-sm font-medium">{t(domainTitleKey(d))}</summary>
          <div className="mt-3 flex flex-col gap-3">
            {PROMPTS.map(([key, label]) => {
              const id = `reflection-${d}-${key}`;
              return (
                <div key={key} className="flex flex-col gap-1">
                  <label htmlFor={id} className="text-sm">{t(label)}</label>
                  <Textarea
                    id={id}
                    value={text[d]?.[key] ?? ""}
                    maxLength={5000}
                    onChange={(e) => update(d, key, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        </details>
      ))}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={save}>{t("scarfReflectionSave")}</Button>
        <span aria-live="polite" className="text-xs text-muted-foreground">
          {error ? t("submitError") : saved ? t("scarfReflectionSaved") : ""}
        </span>
      </div>
    </section>
  );
}
