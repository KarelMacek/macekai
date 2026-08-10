// Hand-written to match assessments/serializers.py. Kept intentionally small
// and flat rather than full openapi-typescript codegen for now — revisit
// with `npx openapi-typescript http://localhost:8000/api/schema/` if this
// drifts from the backend enough to be worth automating.

export interface Config {
  dev_login: boolean;
}

export interface WhoAmI {
  is_authenticated: boolean;
  username?: string;
  email?: string;
}

export type TestType = "snapshot" | "mapping";
export type QuestionType = "likert" | "open_text";
export type StepStatus = "completed" | "current" | "upcoming";

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
}

export interface AnswerRead {
  question_id: number;
  selected_option_id: number | null;
  text_value: string;
  comment: string;
}

export interface ComputedResult {
  categories?: Record<string, number>;
  matched_thresholds?: Record<string, number>;
}

export interface TestSubmission {
  id: number;
  test_slug: string;
  test_type: TestType;
  submitted_at: string;
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
  steps: JourneyStepStatus[];
  all_tests_done: boolean;
  feedback_request_submitted?: boolean;
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
  published_at: string | null;
}
