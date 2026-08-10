import axios from "axios";

import type {
  AdminFeedback,
  AnswerInput,
  Config,
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

export async function getSubmissions(): Promise<TestSubmission[]> {
  const { data } = await client.get<TestSubmission[]>("/api/assessments/submissions/");
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
