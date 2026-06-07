-- Alter public.user_role enum to add new roles
-- We run these statements conditionally or directly as ALTER TYPE can add values.
-- In PostgreSQL, we can add values if they don't exist.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'superadmin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'teacher';

-- Add created_by relation to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Migrate existing 'admin' profiles to 'superadmin'
UPDATE public.profiles SET role = 'superadmin' WHERE role = 'admin';

-- Drop old triggers and recreate triggers/helper functions
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'teacher'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'student'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'superadmin' OR role = 'teacher')
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Re-create the sign-up handle trigger function with the new role parsing and created_by field mapping
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_role public.user_role;
  meta_name TEXT;
  meta_created_by UUID;
BEGIN
  meta_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  IF NEW.raw_user_meta_data->>'role' = 'superadmin' OR NEW.raw_user_meta_data->>'role' = 'admin' THEN
    meta_role := 'superadmin';
  ELSIF NEW.raw_user_meta_data->>'role' = 'teacher' THEN
    meta_role := 'teacher';
  ELSE
    meta_role := 'student';
  END IF;

  IF NEW.raw_user_meta_data->>'created_by' IS NOT NULL THEN
    meta_created_by := (NEW.raw_user_meta_data->>'created_by')::UUID;
  ELSE
    meta_created_by := NULL;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, created_by)
  VALUES (NEW.id, NEW.email, meta_name, meta_role, meta_created_by)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        role = EXCLUDED.role,
        created_by = COALESCE(EXCLUDED.created_by, public.profiles.created_by),
        updated_at = now();

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Re-create fine-grained policies
-- ---------------------------------------------------------------------------

-- Profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile name" ON public.profiles;

CREATE POLICY "Profiles SELECT policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_superadmin() OR (public.is_teacher() AND (created_by = auth.uid() OR id = auth.uid())));

CREATE POLICY "Profiles INSERT policy" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin() OR (public.is_teacher() AND role = 'student' AND created_by = auth.uid()));

CREATE POLICY "Profiles UPDATE policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_superadmin() OR (public.is_teacher() AND created_by = auth.uid()))
  WITH CHECK (id = auth.uid() OR public.is_superadmin() OR (public.is_teacher() AND created_by = auth.uid() AND role = 'student'));

CREATE POLICY "Profiles DELETE policy" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_superadmin() OR (public.is_teacher() AND created_by = auth.uid()));

-- Tests
DROP POLICY IF EXISTS "Admins full access tests" ON public.tests;

CREATE POLICY "Superadmin full access tests" ON public.tests
  FOR ALL TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE POLICY "Teacher own tests access" ON public.tests
  FOR ALL TO authenticated
  USING (public.is_teacher() AND created_by = auth.uid())
  WITH CHECK (public.is_teacher() AND created_by = auth.uid());

-- Questions
DROP POLICY IF EXISTS "Admins full access questions" ON public.questions;

CREATE POLICY "Superadmin full access questions" ON public.questions
  FOR ALL TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE POLICY "Teacher own test questions access" ON public.questions
  FOR ALL TO authenticated
  USING (
    public.is_teacher()
    AND EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = questions.test_id AND t.created_by = auth.uid()
    )
  )
  WITH CHECK (
    public.is_teacher()
    AND EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = questions.test_id AND t.created_by = auth.uid()
    )
  );

-- Attempts
DROP POLICY IF EXISTS "Admins read all attempts" ON public.attempts;

CREATE POLICY "Superadmin read all attempts" ON public.attempts
  FOR SELECT TO authenticated
  USING (public.is_superadmin());

CREATE POLICY "Teacher read own student attempts" ON public.attempts
  FOR SELECT TO authenticated
  USING (
    public.is_teacher()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = attempts.student_id AND p.created_by = auth.uid()
    )
  );

-- Responses
DROP POLICY IF EXISTS "Admins read all responses" ON public.responses;

CREATE POLICY "Superadmin read all responses" ON public.responses
  FOR SELECT TO authenticated
  USING (public.is_superadmin());

CREATE POLICY "Teacher read own student responses" ON public.responses
  FOR SELECT TO authenticated
  USING (
    public.is_teacher()
    AND EXISTS (
      SELECT 1 FROM public.attempts a
      JOIN public.profiles p ON a.student_id = p.id
      WHERE a.id = responses.attempt_id AND p.created_by = auth.uid()
    )
  );

-- Test Visibility
DROP POLICY IF EXISTS "Admins full access test_visibility" ON public.test_visibility;

CREATE POLICY "Superadmin full access test_visibility" ON public.test_visibility
  FOR ALL TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE POLICY "Teacher own tests visibility access" ON public.test_visibility
  FOR ALL TO authenticated
  USING (
    public.is_teacher()
    AND EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_visibility.test_id AND t.created_by = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = test_visibility.student_id AND p.created_by = auth.uid()
    )
  )
  WITH CHECK (
    public.is_teacher()
    AND EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_visibility.test_id AND t.created_by = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = test_visibility.student_id AND p.created_by = auth.uid()
    )
  );

-- Email Notifications Log
DROP POLICY IF EXISTS "Admins read email log" ON public.email_notifications_log;

CREATE POLICY "Superadmin read email log" ON public.email_notifications_log
  FOR SELECT TO authenticated
  USING (public.is_superadmin());

CREATE POLICY "Teacher read own test email log" ON public.email_notifications_log
  FOR SELECT TO authenticated
  USING (
    public.is_teacher()
    AND EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = email_notifications_log.test_id AND t.created_by = auth.uid()
    )
  );

-- Notify PostgREST to reload the schema cache immediately
SELECT pg_notify('pgrst', 'reload schema');
