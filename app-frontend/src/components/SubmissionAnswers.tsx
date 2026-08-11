import { useTranslation } from "@/lib/i18n";
import type { TestSubmission } from "@/types/api";

export function SubmissionAnswers({ submission }: { submission: TestSubmission }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold">{submission.test_slug}</h2>

      {submission.test_type === "snapshot" && (
        <div className="flex flex-col gap-1">
          {Object.entries(submission.computed_result.categories ?? {}).map(([key, score]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{key}</span>
              <span className="tabular-nums">{Math.round(score * 100)}%</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {submission.answers.map((answer, i) => (
          <div key={i} className="flex flex-col gap-1 border-b pb-3 text-sm last:border-0">
            <p className="font-medium">{answer.question_text}</p>
            <p className="text-muted-foreground">{answer.selected_option_label ?? answer.text_value}</p>
            {answer.comment && (
              <p className="text-xs text-muted-foreground italic">
                {t("commentLabel")}: {answer.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
