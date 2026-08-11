import type { TestSubmission } from "@/types/api";

export function SubmissionAnswers({ submission }: { submission: TestSubmission }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{submission.test_slug}</h2>
      {submission.test_type === "snapshot" ? (
        Object.entries(submission.computed_result.categories ?? {}).map(([key, score]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{key}</span>
            <span className="tabular-nums">{Math.round(score * 100)}%</span>
          </div>
        ))
      ) : (
        submission.answers.map((answer, i) => (
          <p key={i} className="text-sm text-muted-foreground">
            {answer.text_value}
          </p>
        ))
      )}
    </div>
  );
}
