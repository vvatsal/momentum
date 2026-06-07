-- Create test_visibility junction table
CREATE TABLE IF NOT EXISTS public.test_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (test_id, student_id)
);

-- Enable RLS
ALTER TABLE public.test_visibility ENABLE ROW LEVEL SECURITY;

-- Drop old students read policy
DROP POLICY IF EXISTS "Students read published available tests" ON public.tests;

-- Create updated students read policy
CREATE POLICY "Students read published assigned tests"
  ON public.tests FOR SELECT
  TO authenticated
  USING (
    public.is_student()
    AND status = 'published'
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
    AND EXISTS (
      SELECT 1 FROM public.test_visibility tv
      WHERE tv.test_id = public.tests.id AND tv.student_id = auth.uid()
    )
  );

-- Admins can do anything on test_visibility
CREATE POLICY "Admins full access test_visibility" 
  ON public.test_visibility FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Students can read their own test visibility assignments
CREATE POLICY "Students read own test_visibility" 
  ON public.test_visibility FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() AND public.is_student());

-- Insert visibility for all existing students and tests to maintain backward compatibility
INSERT INTO public.test_visibility (test_id, student_id)
SELECT t.id, p.id
FROM public.tests t
CROSS JOIN public.profiles p
WHERE p.role = 'student'
ON CONFLICT DO NOTHING;
