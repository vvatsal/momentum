-- Increase precision for numeric questions to prevent overflow with scientific notation
ALTER TABLE public.questions 
  ALTER COLUMN numeric_tolerance TYPE NUMERIC;

ALTER TABLE public.responses 
  ALTER COLUMN numeric_answer TYPE NUMERIC;

-- Reload schema cache to ensure PostgREST picks up the type changes
SELECT pg_notify('pgrst', 'reload schema');
