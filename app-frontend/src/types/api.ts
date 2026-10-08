// Hand-written to match assessments/serializers.py. Kept intentionally small
// and flat rather than full openapi-typescript codegen for now — revisit
// with `npx openapi-typescript http://localhost:8000/api/schema/` if this
// drifts from the backend enough to be worth automating.

export interface Config {
  dev_login: boolean;
  diagnostics_purchase_url: string;
}

export interface WhoAmI {
  is_authenticated: boolean;
  username?: string;
  email?: string;
  has_diagnostics?: boolean;
  consent_recorded?: boolean;
  is_staff?: boolean;
  purchased_language?: string;
}

export interface ConsentPayload {
  ai_processing_consent: boolean;
  research_consent: boolean;
}

export interface ConsentRecord extends ConsentPayload {
  recorded_at: string;
}

export type TestType = "snapshot" | "mapping" | "reflection";
export type ResponseState = "answered" | "not_applicable" | "skipped";
export type QuestionType = "likert" | "open_text";
export type StepStatus = "completed" | "current" | "in_progress" | "upcoming";

export interface LikertOption {
  id: number;
  value: number;
  label: string;
  order: number;
}

export interface Question {
  id: number;
  question_type: QuestionType;
  text: string;
  help_text: string;
  order: number;
  allow_comment: boolean;
  category_key: string | null;
  // Type-specific settings; reflection items carry {domain, pair, role, item_id}.
  config: { domain?: string; pair?: string; role?: "experience" | "contribution"; item_id?: string };
  options: LikertOption[];
}

export interface ResultThreshold {
  id: number;
  min_score: number;
  max_score: number;
  title: string;
  description: string;
}

export interface Category {
  id: number;
  key: string;
  name: string;
  order: number;
  thresholds: ResultThreshold[];
}

export interface TestDetail {
  id: number;
  slug: string;
  test_type: TestType;
  version: number;
  title: string;
  description: string;
  instructions: string;
  questions: Question[];
  categories: Category[];
}

export interface AnswerInput {
  question_id: number;
  option_id?: number | null;
  text_value?: string;
  comment?: string;
  response_state?: ResponseState;
}

export interface AnswerRead {
  question_id: number;
  question_text: string;
  selected_option_id: number | null;
  selected_option_label: string | null;
  text_value: string;
  comment: string;
  response_state: ResponseState;
}

export interface ReflectionCell {
  // null when fewer than 2 of the 3 items have numerical answers.
  mean: number | null;
  rated: number;
  total: number;
}

export type ReflectionResult = Record<string, { experience: ReflectionCell; contribution: ReflectionCell }>;

// domain key -> the three optional prompts of the written reflection.
export type ReflectionText = Record<string, { situation: string; exception: string; missing: string }>;

export interface ComputedResult {
  categories?: Record<string, number>;
  matched_thresholds?: Record<string, number>;
  reflection?: ReflectionResult;
}

export type TestSubmissionStatus = "draft" | "submitted";

export interface TestSubmission {
  id: number;
  test_slug: string;
  test_type: TestType;
  status: TestSubmissionStatus;
  // null while status is "draft" — only set once the test is finalized.
  submitted_at: string | null;
  computed_result: ComputedResult;
  answers: AnswerRead[];
}

export interface JourneyStepStatus {
  order: number;
  test_slug: string;
  test_type: TestType;
  title: string;
  status: StepStatus;
}

export interface JourneyStatus {
  journey_slug: string | null;
  diagnostics_id: number | null;
  steps: JourneyStepStatus[];
  all_tests_done: boolean;
  feedback_request_submitted?: boolean;
}

export type DiagnosticsStatus =
  | "tests_in_progress"
  | "awaiting_feedback_request"
  | "awaiting_admin_review"
  | "completed";

export interface DiagnosticsSummary {
  id: number;
  journey_slug: string;
  opened_at: string;
  status: DiagnosticsStatus;
  language: string;
}

export interface FeedbackRequest {
  id: number;
  cv_file: string | null;
  linkedin_url: string;
  requested_at: string;
}

export interface AdminFeedback {
  document_url: string | null;
  video_url: string;
  notes: string;
  email_subject: string;
  email_body: string;
  published_at: string | null;
}

export interface DiagnosticsDetail {
  id: number;
  email: string;
  journey_slug: string;
  opened_at: string;
  status: DiagnosticsStatus;
  language: string;
  all_tests_done: boolean;
  steps: JourneyStepStatus[];
  submissions: TestSubmission[];
  feedback_request: FeedbackRequest | null;
  feedback: AdminFeedback | null;
  // null = no linked user yet / consent never recorded, distinct from false.
  // Two separate questions — never blend these into one "AI/ML" flag.
  ai_consent: boolean | null;
  research_consent: boolean | null;
}

export interface AdminDiagnosticsSummary extends DiagnosticsSummary {
  email: string;
}

export interface AdminDiagnosticsStats {
  paid_count: number;
  started_count: number;
  completed_count: number;
}

export interface AdminFeedbackWritePayload {
  document?: File | null;
  video_url?: string;
  notes?: string;
  email_subject?: string;
  email_body?: string;
  is_published?: boolean;
}

export interface AdminUserSummary {
  id: number;
  email: string;
  is_staff: boolean;
  date_joined: string | null;
  diagnostics_count: number;
  submissions_count: number;
  feedback_requests_count: number;
  file_count: number;
  has_consent: boolean;
}

export interface EraseIdentityResult {
  email: string;
  diagnostics_count: number;
  submissions_count: number;
  file_count: number;
}

export interface AdminJourneySummary {
  slug: string;
  name: string;
}

export interface GrantAccessResult {
  diagnostics_id: number;
  email: string;
  journey_slug: string;
}
