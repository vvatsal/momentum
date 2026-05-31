export type UserRole = "admin" | "student";
export type QuestionType = "mcq" | "numeric";
export type TestStatus = "draft" | "published" | "archived";
export type AttemptStatus = "in_progress" | "submitted";
export type ResponseStatus = "unanswered" | "answered" | "skipped";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Test {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  starts_at: string | null;
  ends_at: string | null;
  duration_minutes: number | null;
  status: TestStatus;
  is_locked: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface Question {
  id: string;
  test_id: string;
  order_index: number;
  type: QuestionType;
  question_text: string;
  image_url: string | null;
  marks: number;
  correct_answer: McqCorrectAnswer | NumericCorrectAnswer;
  options: string[] | null;
  numeric_tolerance: number | null;
  explanation: string | null;
  created_at: string;
  updated_at: string;
}

export interface McqCorrectAnswer {
  option: string;
}

export interface NumericCorrectAnswer {
  value: number;
}

export interface Attempt {
  id: string;
  test_id: string;
  student_id: string;
  status: AttemptStatus;
  started_at: string;
  last_seen_at: string;
  submitted_at: string | null;
  total_time_seconds: number;
  total_score: number | null;
  max_score: number | null;
  current_question_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Response {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option: string | null;
  numeric_answer: number | null;
  status: ResponseStatus;
  time_spent_seconds: number;
  visited_count: number;
  first_seen_at: string | null;
  last_seen_at: string | null;
  answered_at: string | null;
  is_correct: boolean | null;
  awarded_marks: number | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Profile>;
      };
      tests: { Row: Test; Insert: Partial<Test>; Update: Partial<Test> };
      questions: { Row: Question; Insert: Partial<Question>; Update: Partial<Question> };
      attempts: { Row: Attempt; Insert: Partial<Attempt>; Update: Partial<Attempt> };
      responses: { Row: Response; Insert: Partial<Response>; Update: Partial<Response> };
    };
    Enums: {
      user_role: UserRole;
      question_type: QuestionType;
      test_status: TestStatus;
      attempt_status: AttemptStatus;
      response_status: ResponseStatus;
    };
  };
}
