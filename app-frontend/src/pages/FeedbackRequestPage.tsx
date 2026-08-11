import { useState } from "react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitFeedbackRequest } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";

export function FeedbackRequestPage() {
  const { t } = useTranslation();
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!cvFile && !linkedinUrl.trim()) {
      setError(t("provideOneOf"));
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedbackRequest({ cv_file: cvFile, linkedin_url: linkedinUrl.trim() });
      setSubmitted(true);
    } catch {
      setError(t("submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-8">
        <p className="text-sm">{t("feedbackRequestSubmitted")}</p>
        <Link href="/feedback">
          <Button size="sm">{t("continueButton")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-xl flex-col gap-6 p-8">
      <div>
        <h1 className="mb-2 text-lg font-semibold">{t("requestFeedbackTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("requestFeedbackIntro")}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cv_file">{t("cvLabel")}</Label>
        <Input
          id="cv_file"
          type="file"
          accept="application/pdf"
          onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="linkedin_url">{t("linkedinLabel")}</Label>
        <Input
          id="linkedin_url"
          name="linkedin_url"
          type="url"
          autoComplete="off"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://www.linkedin.com/in/…"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting}>
        {t("submitButton")}
      </Button>
    </form>
  );
}
