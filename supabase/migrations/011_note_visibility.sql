-- Migration: Add note_visibility table and update notes RLS policies
CREATE TABLE IF NOT EXISTS public.note_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (note_id, student_id)
);

-- Enable RLS
ALTER TABLE public.note_visibility ENABLE ROW LEVEL SECURITY;

-- note_visibility RLS policies
CREATE POLICY "Superadmin full access note_visibility" ON public.note_visibility
  FOR ALL TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE POLICY "Teacher own notes visibility access" ON public.note_visibility
  FOR ALL TO authenticated
  USING (
    public.is_teacher()
    AND EXISTS (
      SELECT 1 FROM public.notes n
      WHERE n.id = note_visibility.note_id AND n.created_by = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = note_visibility.student_id AND p.created_by = auth.uid()
    )
  )
  WITH CHECK (
    public.is_teacher()
    AND EXISTS (
      SELECT 1 FROM public.notes n
      WHERE n.id = note_visibility.note_id AND n.created_by = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = note_visibility.student_id AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Students read own note_visibility" 
  ON public.note_visibility FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() AND public.is_student());

-- Drop old public select policy on notes
DROP POLICY IF EXISTS "Select notes authenticated" ON public.notes;

-- Create updated policies for notes SELECT
CREATE POLICY "Students read assigned notes" ON public.notes
  FOR SELECT TO authenticated
  USING (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.note_visibility nv
      WHERE nv.note_id = public.notes.id AND nv.student_id = auth.uid()
    )
  );

CREATE POLICY "Admins/Teachers read all notes" ON public.notes
  FOR SELECT TO authenticated
  USING (public.is_superadmin() OR public.is_teacher());

-- Insert visibility for all existing students and notes to maintain backward compatibility
INSERT INTO public.note_visibility (note_id, student_id)
SELECT n.id, p.id
FROM public.notes n
CROSS JOIN public.profiles p
WHERE p.role = 'student'
ON CONFLICT DO NOTHING;

-- Notify PostgREST to reload the schema cache immediately
SELECT pg_notify('pgrst', 'reload schema');
