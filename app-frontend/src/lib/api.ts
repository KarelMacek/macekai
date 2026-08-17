import axios from "axios";

import type {
  AdminDiagnosticsSummary,
  AdminFeedback,
  AdminFeedbackWritePayload,
  AnswerInput,
  Config,
  ConsentPayload,
  ConsentRecord,
  DiagnosticsDetail,
  DiagnosticsSummary,
  FeedbackRequest,
  JourneyStatus,
  TestDetail,
  TestSubmission,
  WhoAmI,
} from "@/types/api";

// The SPA view's ensure_csrf_cookie guarantees a csrftoken cookie exists;
// Django's CsrfViewMiddleware expects it echoed back as X-CSRFToken on
// mutating requests.
function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

const client = axios.create({
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  if (config.method && config.method.toLowerCase() !== "get") {
    config.headers["X-CSRFToken"] = getCsrfToken();
  }
  return config;
});

export async function getConfig(): Promise<Config> {
  const { data } = await client.get<Config>("/api/config/");
  return data;
}

export async function getWhoAmI(): Promise<WhoAmI | null> {
  try {
    const { data } = await client.get<WhoAmI>("/api/whoami/");
    return data;
  } catch {
    return null;
  }
}

export async function getJourney(lang: string): Promise<JourneyStatus> {
  const { data } = await client.get<JourneyStatus>("/api/assessments/journey/", {
    params: { lang },
  });
  return data;
}

export async function getTest(slug: string, lang: string): Promise<TestDetail> {
  const { data } = await client.get<TestDetail>(`/api/assessments/tests/${slug}/`, {
    params: { lang },
  });
  return data;
}

export async function submitTest(slug: string, answers: AnswerInput[]): Promise<TestSubmission> {
  const { data } = await client.post<TestSubmission>(`/api/assessments/tests/${slug}/submit/`, {
    answers,
  });
  return data;
}

// Fetches (and lazily creates/seeds — from the latest submitted attempt's
// answers, if any) the current in-progress draft for this test. The same
// primitive backs both "resume where I left off" and "edit a submitted
// test": a first-time visit gets an empty draft, re-opening a completed
// test for editing gets one pre-filled with the previous answers.
export async function getDraft(slug: string): Promise<TestSubmission> {
  const { data } = await client.get<TestSubmission>(`/api/assessments/tests/${slug}/draft/`);
  return data;
}

// Autosaves one or more answers into the draft. Safe to call after every
// single answer — upsert semantics, never loses prior progress.
export async function patchDraft(slug: string, answers: AnswerInput[]): Promise<TestSubmission> {
  const { data } = await client.patch<TestSubmission>(`/api/assessments/tests/${slug}/draft/`, {
    answers,
  });
  return data;
}

export async function getSubmissions(): Promise<TestSubmission[]> {
  const { data } = await client.get<TestSubmission[]>("/api/assessments/submissions/");
  return data;
}

export async function submitConsent(payload: ConsentPayload): Promise<ConsentRecord> {
  const { data } = await client.post<ConsentRecord>("/api/assessments/consent/", payload);
  return data;
}

export async function getFeedbackRequest(): Promise<FeedbackRequest | null> {
  try {
    const { data } = await client.get<FeedbackRequest>("/api/assessments/feedback-request/");
    return data;
  } catch {
    return null;
  }
}

export async function submitFeedbackRequest(payload: {
  cv_file?: File | null;
  linkedin_url?: string;
}): Promise<FeedbackRequest> {
  const form = new FormData();
  if (payload.cv_file) form.append("cv_file", payload.cv_file);
  if (payload.linkedin_url) form.append("linkedin_url", payload.linkedin_url);

  const { data } = await client.post<FeedbackRequest>("/api/assessments/feedback-request/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getFeedback(): Promise<AdminFeedback | null> {
  try {
    const { data } = await client.get<AdminFeedback>("/api/assessments/feedback/");
    return data;
  } catch {
    return null;
  }
}

export async function getDiagnosticsList(): Promise<DiagnosticsSummary[]> {
  const { data } = await client.get<DiagnosticsSummary[]>("/api/assessments/diagnostics/");
  return data;
}

export async function getDiagnosticsDetail(id: number, lang: string): Promise<DiagnosticsDetail> {
  const { data } = await client.get<DiagnosticsDetail>(`/api/assessments/diagnostics/${id}/`, {
    params: { lang },
  });
  return data;
}

export async function getAdminDiagnosticsList(params: {
  status?: string;
  q?: string;
}): Promise<AdminDiagnosticsSummary[]> {
  const { data } = await client.get<AdminDiagnosticsSummary[]>("/api/assessments/admin/diagnostics/", {
    params,
  });
  return data;
}

export async function getAdminDiagnosticsDetail(id: number, lang: string): Promise<DiagnosticsDetail> {
  const { data } = await client.get<DiagnosticsDetail>(`/api/assessments/admin/diagnostics/${id}/`, {
    params: { lang },
  });
  return data;
}

export async function submitAdminFeedback(
  feedbackRequestId: number,
  payload: AdminFeedbackWritePayload
): Promise<AdminFeedback> {
  const form = new FormData();
  if (payload.document) form.append("document", payload.document);
  if (payload.video_url !== undefined) form.append("video_url", payload.video_url);
  if (payload.notes !== undefined) form.append("notes", payload.notes);
  if (payload.is_published !== undefined) form.append("is_published", String(payload.is_published));

  const { data } = await client.post<AdminFeedback>(
    `/api/assessments/admin/feedback-requests/${feedbackRequestId}/feedback/`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}
