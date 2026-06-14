-- Migration: Add notes table and RLS policies
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,                   -- Storage bucket path (null for text-only MD)
  file_type TEXT NOT NULL,          -- 'pdf' or 'markdown'
  content TEXT,                     -- Inline markdown contents (if markdown)
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Policies
CREATE POLICY "Select notes authenticated" ON public.notes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Superadmin manage notes" ON public.notes
  FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

CREATE POLICY "Teacher own notes" ON public.notes
  FOR ALL TO authenticated
  USING (public.is_teacher() AND created_by = auth.uid())
  WITH CHECK (public.is_teacher() AND created_by = auth.uid());

-- Notify PostgREST to reload the schema cache immediately
SELECT pg_notify('pgrst', 'reload schema');
