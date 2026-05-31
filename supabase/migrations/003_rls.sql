-- Row Level Security

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications_log ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can update own profile name"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------
CREATE POLICY "Students read published available tests"
  ON public.tests FOR SELECT
  TO authenticated
  USING (
    public.is_student()
    AND status = 'published'
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

CREATE POLICY "Admins full access tests"
  ON public.tests FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------
CREATE POLICY "Students read questions for available published tests"
  ON public.questions FOR SELECT
  TO authenticated
  USING (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = questions.test_id
        AND t.status = 'published'
        AND (t.starts_at IS NULL OR t.starts_at <= now())
        AND (t.ends_at IS NULL OR t.ends_at >= now())
    )
  );

CREATE POLICY "Admins full access questions"
  ON public.questions FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Attempts
-- ---------------------------------------------------------------------------
CREATE POLICY "Students manage own attempts"
  ON public.attempts FOR ALL
  TO authenticated
  USING (student_id = auth.uid() AND public.is_student())
  WITH CHECK (student_id = auth.uid() AND public.is_student());

CREATE POLICY "Admins read all attempts"
  ON public.attempts FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- Responses
-- ---------------------------------------------------------------------------
CREATE POLICY "Students manage own responses"
  ON public.responses FOR ALL
  TO authenticated
  USING (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.attempts a
      WHERE a.id = responses.attempt_id
        AND a.student_id = auth.uid()
        AND a.status = 'in_progress'
    )
  )
  WITH CHECK (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.attempts a
      WHERE a.id = responses.attempt_id
        AND a.student_id = auth.uid()
        AND a.status = 'in_progress'
    )
  );

CREATE POLICY "Students read own submitted responses"
  ON public.responses FOR SELECT
  TO authenticated
  USING (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.attempts a
      WHERE a.id = responses.attempt_id
        AND a.student_id = auth.uid()
    )
  );

CREATE POLICY "Admins read all responses"
  ON public.responses FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- Email log (service role / admin only via server)
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins read email log"
  ON public.email_notifications_log FOR SELECT
  TO authenticated
  USING (public.is_admin());
