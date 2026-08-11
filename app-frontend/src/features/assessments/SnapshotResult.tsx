import { useTranslation } from "@/lib/i18n";
import type { Category, TestSubmission } from "@/types/api";

interface Props {
  categories: Category[];
  submission: TestSubmission;
}

export function SnapshotResult({ categories, submission }: Props) {
  const { t } = useTranslation();
  const scores = submission.computed_result.categories ?? {};
  const matchedThresholds = submission.computed_result.matched_thresholds ?? {};

  return (
    <div className="mx-auto w-full max-w-xl">
      <h2 className="mb-6 text-xl font-semibold">{t("resultTitle")}</h2>

      <div className="flex flex-col gap-6">
        {categories.map((category) => {
          const score = scores[category.key];
          if (score === undefined) return null;
          const thresholdId = matchedThresholds[category.key];
          const threshold = category.thresholds.find((th) => th.id === thresholdId);

          return (
            <div key={category.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{category.name}</span>
                <span className="tabular-nums text-muted-foreground">{Math.round(score * 100)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-primary/20">
                <div className="h-full rounded-full bg-primary" style={{ width: `${score * 100}%` }} />
              </div>
              {threshold && (
                <div className="mt-2">
                  <p className="text-sm font-medium">{threshold.title}</p>
                  {threshold.description && (
                    <p className="text-sm text-muted-foreground">{threshold.description}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
