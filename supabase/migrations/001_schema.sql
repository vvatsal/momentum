-- Momentum Exam Platform — core schema
-- Run in Supabase SQL Editor or via Supabase CLI

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM ('admin', 'student');
CREATE TYPE public.question_type AS ENUM ('mcq', 'msq', 'numeric');
CREATE TYPE public.test_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.attempt_status AS ENUM ('in_progress', 'submitted');
CREATE TYPE public.response_status AS ENUM ('unanswered', 'answered', 'skipped');

-- ---------------------------------------------------------------------------
-- Profiles (linked to auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_email_unique UNIQUE (email)
);

CREATE INDEX profiles_role_idx ON public.profiles (role);
CREATE INDEX profiles_email_idx ON public.profiles (email);

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------
CREATE TABLE public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  status public.test_status NOT NULL DEFAULT 'draft',
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX tests_status_idx ON public.tests (status);
CREATE INDEX tests_starts_at_idx ON public.tests (starts_at);
CREATE INDEX tests_created_by_idx ON public.tests (created_by);

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL CHECK (order_index >= 0),
  type public.question_type NOT NULL,
  question_text TEXT NOT NULL,
  image_url TEXT,
  marks NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (marks >= 0),
  correct_answer JSONB NOT NULL,
  options JSONB,
  numeric_tolerance NUMERIC(12, 6),
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT questions_test_order_unique UNIQUE (test_id, order_index)
);

CREATE INDEX questions_test_id_idx ON public.questions (test_id);
CREATE INDEX questions_test_order_idx ON public.questions (test_id, order_index);

-- ---------------------------------------------------------------------------
-- Attempts
-- ---------------------------------------------------------------------------
CREATE TABLE public.attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.attempt_status NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  total_time_seconds INTEGER NOT NULL DEFAULT 0 CHECK (total_time_seconds >= 0),
  total_score NUMERIC(12, 2),
  max_score NUMERIC(12, 2),
  current_question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT attempts_one_active_per_test UNIQUE (test_id, student_id)
);

CREATE INDEX attempts_test_id_idx ON public.attempts (test_id);
CREATE INDEX attempts_student_id_idx ON public.attempts (student_id);
CREATE INDEX attempts_status_idx ON public.attempts (status);

-- ---------------------------------------------------------------------------
-- Responses (per question per attempt)
-- ---------------------------------------------------------------------------
CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option TEXT,
  numeric_answer NUMERIC(20, 8),
  status public.response_status NOT NULL DEFAULT 'unanswered',
  time_spent_seconds INTEGER NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
  visited_count INTEGER NOT NULL DEFAULT 0 CHECK (visited_count >= 0),
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  is_correct BOOLEAN,
  awarded_marks NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT responses_attempt_question_unique UNIQUE (attempt_id, question_id)
);

CREATE INDEX responses_attempt_id_idx ON public.responses (attempt_id);
CREATE INDEX responses_question_id_idx ON public.responses (question_id);

-- ---------------------------------------------------------------------------
-- Email notifications log (Phase 4)
-- ---------------------------------------------------------------------------
CREATE TABLE public.email_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES public.tests(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  resend_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX email_notifications_log_test_id_idx ON public.email_notifications_log (test_id);
