import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitTest } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import type { AnswerInput, TestDetail, TestSubmission } from "@/types/api";

interface Props {
  test: TestDetail;
  onComplete: (submission: TestSubmission) => void;
}

export function MappingTest({ test, onComplete }: Props) {
  const { t } = useTranslation();

  const schema = z.object(
    Object.fromEntries(
      test.questions.map((q) => [String(q.id), z.string().trim().min(1, t("required"))])
    )
  );
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    const answers: AnswerInput[] = test.questions.map((q) => ({
      question_id: q.id,
      text_value: values[String(q.id)],
    }));

    try {
      const submission = await submitTest(test.slug, answers);
      onComplete(submission);
    } catch {
      setError("root", { message: t("submitError") });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto flex w-full max-w-xl flex-col gap-6">
      {test.questions.map((question) => (
        <div key={question.id} className="flex flex-col gap-2">
          <Label htmlFor={`q-${question.id}`}>{question.text}</Label>
          {question.help_text && <p className="text-sm text-muted-foreground">{question.help_text}</p>}
          <Textarea id={`q-${question.id}`} {...register(String(question.id))} />
          {errors[String(question.id)] && (
            <p className="text-sm text-destructive">{String(errors[String(question.id)]?.message)}</p>
          )}
        </div>
      ))}

      {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {t("submitButton")}
      </Button>
    </form>
  );
}
