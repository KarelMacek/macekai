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

// Deliberately neutral: no colour judgments and no totals. "Receive"
// (experience) and "give" (contribution) are shown as separate bar charts,
// each sorted highest first, plus their per-domain difference.
export function ReflectionResult({ test, submission }: Props) {
  const { t } = useTranslation();
  const cells = submission.computed_result.reflection ?? {};
  const domains = DOMAIN_KEYS.filter((d) => cells[d]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <h1 className="text-xl font-semibold">{t("scarfResultsTitle")}</h1>

      <PerspectiveBars
        heading={t("scarfReceiveHeading")}
        sub={t("scarfReceiveSub")}
        barClass="bg-primary"
        rows={domains.map((d) => ({ domain: d, value: cells[d].experience.mean }))}
      />
      <PerspectiveBars
        heading={t("scarfGiveHeading")}
        sub={t("scarfGiveSub")}
        barClass="bg-foreground/60"
        rows={domains.map((d) => ({ domain: d, value: cells[d].contribution.mean }))}
      />
      <DifferenceBars
        rows={domains.map((d) => ({
          domain: d,
          value: difference(cells[d].experience, cells[d].contribution),
        }))}
      />
      <p className="-mt-4 text-xs text-muted-foreground">{t("scarfNotEnoughInfoShort")}</p>

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

type Row = { domain: string; value: number | null };

// Highest first; domains without enough answers go last, in S-C-A-R-F order.
function sortRows(rows: Row[]): Row[] {
  return [...rows].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
}

function domainName(t: ReturnType<typeof useTranslation>["t"], domain: string): string {
  return t(domainTitleKey(domain)).split(":")[0];
}

function formatSigned(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(1)}`;
}

// Computed from the displayed (rounded) means so the numbers add up visually.
function difference(experience: ReflectionCell, contribution: ReflectionCell): number | null {
  if (experience.mean === null || contribution.mean === null) return null;
  return Math.round((contribution.mean - experience.mean) * 10) / 10;
}

// One card per perspective ("receive" vs. "give") so the two never blur
// into one table. Bars run along the 1-7 scale, highest first.
function PerspectiveBars({ heading, sub, barClass, rows }: { heading: string; sub: string; barClass: string; rows: Row[] }) {
  const { t } = useTranslation();
  return (
    <section className="rounded-lg border p-4">
      <h2 className="text-base font-semibold">{heading}</h2>
      <p className="mb-4 text-xs text-muted-foreground">{sub}</p>
      <ul className="flex flex-col gap-3">
        {sortRows(rows).map(({ domain, value }) => (
          <li key={domain} className="grid grid-cols-[6.5rem_1fr_2.25rem] items-center gap-3 text-sm">
            <span className="truncate">{domainName(t, domain)}</span>
            <span className="h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              {value !== null && (
                <span className={`block h-full rounded-full ${barClass}`} style={{ width: `${((value - 1) / 6) * 100}%` }} />
              )}
            </span>
            <span className="text-right font-semibold tabular-nums">{value === null ? "—" : value.toFixed(1)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 grid grid-cols-[6.5rem_1fr_2.25rem] gap-3 text-[11px] text-muted-foreground" aria-hidden="true">
        <span />
        <span className="flex justify-between">
          <span>1</span>
          <span>7</span>
        </span>
        <span />
      </div>
    </section>
  );
}

// Diverging bars around zero: right = I give more than I receive, left =
// I receive more than I give. Largest first. Neutral colour on purpose.
function DifferenceBars({ rows }: { rows: Row[] }) {
  const { t } = useTranslation();
  return (
    <section className="rounded-lg border p-4">
      <h2 className="text-base font-semibold">{t("scarfDiffHeading")}</h2>
      <p className="mb-4 text-xs text-muted-foreground">{t("scarfDiffSub")}</p>
      <ul className="flex flex-col gap-3">
        {sortRows(rows).map(({ domain, value }) => (
          <li key={domain} className="grid grid-cols-[6.5rem_1fr_2.75rem] items-center gap-3 text-sm">
            <span className="truncate">{domainName(t, domain)}</span>
            <span className="relative h-2.5 rounded-full bg-muted" aria-hidden="true">
              <span className="absolute inset-y-[-3px] left-1/2 w-px bg-muted-foreground/60" />
              {value !== null && value !== 0 && (
                <span
                  className="absolute inset-y-0 rounded-full bg-foreground/60"
                  style={
                    value > 0
                      ? { left: "50%", width: `${(value / 6) * 50}%` }
                      : { right: "50%", width: `${(-value / 6) * 50}%` }
                  }
                />
              )}
            </span>
            <span className="text-right font-semibold tabular-nums">{value === null ? "—" : formatSigned(value)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 grid grid-cols-[6.5rem_1fr] gap-3 text-[11px] text-muted-foreground" aria-hidden="true">
        <span />
        <span className="flex justify-between gap-2 whitespace-nowrap">
          <span>← {t("scarfDiffLeft")}</span>
          <span>{t("scarfDiffRight")} →</span>
        </span>
      </div>
    </section>
  );
}

function DomainAnswers({ domain, test, submission }: { domain: string; test: TestDetail; submission: TestSubmission }) {
  const { t } = useTranslation();
  const byQuestion = new Map(submission.answers.map((a) => [a.question_id, a]));
  // The form order is shuffled (migration 0014); results regroup each
  // domain's items by pair, experience before contribution.
  const questions = test.questions
    .filter((q) => q.config.domain === domain)
    .sort(
      (a, b) =>
        (a.config.pair ?? "").localeCompare(b.config.pair ?? "") ||
        Number(b.config.role === "experience") - Number(a.config.role === "experience"),
    );

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
