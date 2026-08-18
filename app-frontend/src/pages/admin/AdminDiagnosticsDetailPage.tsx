import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";

import { SubmissionAnswers } from "@/components/SubmissionAnswers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAdminDiagnosticsDetail, submitAdminFeedback } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { STATUS_LABEL_KEY } from "@/pages/DashboardPage";
import type { DiagnosticsDetail } from "@/types/api";

export function AdminDiagnosticsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useTranslation();
  const [diagnostics, setDiagnostics] = useState<DiagnosticsDetail | null>(null);
  const [document, setDocument] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getAdminDiagnosticsDetail(Number(id), lang).then((d) => {
      setDiagnostics(d);
      setVideoUrl(d.feedback?.video_url ?? "");
      setNotes(d.feedback?.notes ?? "");
      setIsPublished(!!d.feedback?.published_at);
    });
  }, [id, lang]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!diagnostics?.feedback_request) return;
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const feedback = await submitAdminFeedback(diagnostics.feedback_request.id, {
        document,
        video_url: videoUrl,
        notes,
        is_published: isPublished,
      });
      setDiagnostics({ ...diagnostics, feedback });
      setDocument(null);
      setSaved(true);
    } catch {
      setError(t("submitError"));
    } finally {
      setSaving(false);
    }
  }

  if (!diagnostics) return <p className="p-8 text-sm text-muted-foreground">{t("loading")}</p>;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 p-8">
      <div className="flex flex-col gap-1">
        <Link href="/" className="text-sm text-primary underline underline-offset-4">
          {t("adminBackToDashboard")}
        </Link>
        <h1 className="text-lg font-semibold">{diagnostics.email}</h1>
        <p className="text-sm text-muted-foreground">
          {diagnostics.journey_slug} · {t(STATUS_LABEL_KEY[diagnostics.status])}
        </p>
      </div>

      {diagnostics.submissions.map((submission) => (
        <SubmissionAnswers key={submission.id} submission={submission} />
      ))}

      {!diagnostics.feedback_request ? (
        <p className="text-sm text-muted-foreground">{t("adminNoFeedbackRequest")}</p>
      ) : (
        <>
          <div className="flex flex-col gap-2 text-sm">
            {diagnostics.feedback_request.cv_file && (
              <a
                href={diagnostics.feedback_request.cv_file}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-4"
              >
                {t("adminCvFile")}
              </a>
            )}
            {diagnostics.feedback_request.linkedin_url && (
              <a
                href={diagnostics.feedback_request.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-4"
              >
                {t("adminLinkedinUrl")}
              </a>
            )}
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-4 border-t pt-6">
            <h2 className="text-base font-semibold">{t("adminFeedbackFormTitle")}</h2>

            <div className="flex flex-col gap-2">
              <Label htmlFor="document">{t("adminDocumentLabel")}</Label>
              {diagnostics.feedback?.document_url && (
                <a
                  href={diagnostics.feedback.document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline underline-offset-4"
                >
                  {t("adminCurrentDocument")}
                </a>
              )}
              <Input
                id="document"
                type="file"
                accept="application/pdf"
                onChange={(e) => setDocument(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="video_url">{t("adminVideoUrlLabel")}</Label>
              <Input
                id="video_url"
                name="video_url"
                type="url"
                autoComplete="off"
                placeholder="https://…"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">{t("adminNotesLabel")}</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                />
                {t("adminPublishLabel")}
              </label>
              {!isPublished && (
                <p className="text-xs text-muted-foreground">{t("adminPublishHint")}</p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {saved && !error && <p className="text-sm text-muted-foreground">{t("adminSaved")}</p>}

            <Button type="submit" disabled={saving}>
              {t("adminSaveButton")}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
