import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import type { TestType } from "@/types/api";

interface Props {
  testType: TestType;
  title: string;
  description: string;
  instructions: string;
  onStart: () => void;
}

// The one screen that resolves "what is this, how long will it take, and
// what happens if I stop" before a single question is shown — a 60-question
// (or 20-open-text) test with no orientation up front is what makes it feel
// like a wall rather than a short, resumable exercise.
export function TestIntroScreen({ testType, title, description, instructions, onStart }: Props) {
  const { t } = useTranslation();

  const timeEstimate =
    testType === "snapshot" ? t("introTimeEstimateSnapshot") : t("introTimeEstimateMapping");
  const reassurances = [
    t("introReassuranceNoWrongAnswers"),
    t("introReassuranceAutosave"),
    t("introReassuranceEditable"),
  ];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div>
        <h1 className="mb-2 text-xl font-semibold">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      {instructions && <p className="text-sm text-muted-foreground">{instructions}</p>}

      <p className="section-label">{timeEstimate}</p>

      <ul className="flex flex-col gap-2">
        {reassurances.map((line) => (
          <li key={line} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
            {line}
          </li>
        ))}
      </ul>

      <Button onClick={onStart} className="self-start">
        {t("startTest")}
      </Button>
    </div>
  );
}
