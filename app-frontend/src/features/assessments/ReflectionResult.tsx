import { useEffect, useRef, useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { getReflectionText, saveReflectionText } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import type { ReflectionCell, ReflectionText, TestDetail, TestSubmission } from "@/types/api";

import { DOMAIN_KEYS, domainTitleKey } from "./ReflectionTest";
import type { AutosaveState } from "./SaveExitControl";

const COMMENT_SAVE_DELAY_MS = 800;

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
  const [reflection, setReflection] = useState<ReflectionText>({});
  const [commentSave, setCommentSave] = useState<Record<string, AutosaveState>>({});
  const reflectionRef = useRef<ReflectionText>({});
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    getReflectionText(submission.id)
      .then((loaded) => {
        reflectionRef.current = loaded;
        setReflection(loaded);
      })
      .catch(() => undefined);
    const timers = saveTimers.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, [submission.id]);

  // The endpoint replaces the whole blob, so every save sends all domains,
  // read from the ref so overlapping edits in two domains can't drop each other.
  function updateDomainComment(domain: string, text: string) {
    const next = { ...reflectionRef.current, [domain]: { ...reflectionRef.current[domain], comment: text } };
    reflectionRef.current = next;
    setReflection(next);
    clearTimeout(saveTimers.current[domain]);
    saveTimers.current[domain] = setTimeout(() => {
      setCommentSave((prev) => ({ ...prev, [domain]: "saving" }));
      saveReflectionText(submission.id, reflectionRef.current)
        .then(() => setCommentSave((prev) => ({ ...prev, [domain]: "saved" })))
        .catch(() => setCommentSave((prev) => ({ ...prev, [domain]: "idle" })));
    }, COMMENT_SAVE_DELAY_MS);
  }

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
          <DomainAnswers
            key={d}
            domain={d}
            test={test}
            submission={submission}
            comment={reflection[d]?.comment ?? ""}
            onComment={(text) => updateDomainComment(d, text)}
            saveState={commentSave[d] ?? "idle"}
          />
        ))}
      </section>

      <section className="flex flex-col gap-2 text-sm text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">{t("scarfDifferencesHeading")}</h2>
        <p>{t("scarfDifferences1")}</p>
        <p>{t("scarfDifferences2")}</p>
        <p>{t("scarfDifferences3")}</p>
      </section>

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

interface DomainAnswersProps {
  domain: string;
  test: TestDetail;
  submission: TestSubmission;
  comment: string;
  onComment: (text: string) => void;
  saveState: AutosaveState;
}

// One domain's statements, split into "what I receive" (experience) and
// "what I give" (contribution), each sorted highest first with a 1-7 bar.
// Skipped / N/A items go last. A single free comment on the whole domain
// sits right under its statements.
function DomainAnswers({ domain, test, submission, comment, onComment, saveState }: DomainAnswersProps) {
  const { t } = useTranslation();
  const byQuestion = new Map(submission.answers.map((a) => [a.question_id, a]));
  const cell = submission.computed_result.reflection?.[domain];
  const commentId = `domain-comment-${domain}`;

  function items(role: "experience" | "contribution") {
    return test.questions
      .filter((q) => q.config.domain === domain && q.config.role === role)
      .map((q) => {
        const a = byQuestion.get(q.id);
        const value =
          a?.response_state === "answered" ? (q.options.find((o) => o.id === a.selected_option_id)?.value ?? null) : null;
        return { q, a, value };
      })
      .sort((x, y) => (y.value ?? -Infinity) - (x.value ?? -Infinity));
  }

  function group(role: "experience" | "contribution", heading: string, barClass: string) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="section-label text-gold">{heading}</h3>
        <ul className="flex flex-col gap-4">
          {items(role).map(({ q, a, value }) => (
            <li key={q.id} className="flex flex-col gap-1.5 text-sm">
              <span>{q.text}</span>
              {value !== null ? (
                <span className="grid grid-cols-[1fr_2rem] items-center gap-3">
                  <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <span className={`block h-full rounded-full ${barClass}`} style={{ width: `${((value - 1) / 6) * 100}%` }} />
                  </span>
                  <span className="text-right font-semibold tabular-nums">{value}</span>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {a?.response_state === "not_applicable" ? t("scarfStateNotApplicable") : t("scarfStateSkipped")}
                </span>
              )}
              {a?.comment && (
                <span className="block whitespace-pre-line text-xs text-muted-foreground italic">
                  {t("commentLabel")}: {a.comment}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <details className="rounded-md border p-3 sm:p-4">
      <summary className="cursor-pointer text-sm font-medium">
        {t(domainTitleKey(domain))}
        {cell && (
          <span className="mt-0.5 block text-xs font-normal text-muted-foreground tabular-nums">
            {t("scarfReceiveHeading")} {cell.experience.mean?.toFixed(1) ?? "—"} · {t("scarfGiveHeading")}{" "}
            {cell.contribution.mean?.toFixed(1) ?? "—"}
          </span>
        )}
      </summary>
      <div className="mt-4 flex flex-col gap-6">
        {group("experience", t("scarfReceiveHeading"), "bg-primary")}
        <div className="border-t" />
        {group("contribution", t("scarfGiveHeading"), "bg-foreground/60")}
        <div className="flex flex-col gap-1 border-t pt-4">
          <label htmlFor={commentId} className="text-sm font-medium">
            {t("scarfDomainComment")}
          </label>
          <Textarea id={commentId} value={comment} maxLength={5000} onChange={(e) => onComment(e.target.value)} className="min-h-20" />
          <span className="h-4 text-xs text-muted-foreground" aria-live="polite">
            {saveState === "saving" ? t("savingIndicator") : saveState === "saved" ? t("savedIndicator") : ""}
          </span>
        </div>
      </div>
    </details>
  );
}
